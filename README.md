# TechLearn API

API REST del proyecto **TechLearn**, un catálogo de cursos de tecnología con tres roles (administrador, instructor y usuario).

> Frontend: repositorio `techlearn-frontend` (React + Vite).

## Tecnologías

| Capa | Tecnología |
|---|---|
| Runtime / Framework | Node.js 20+ y Express 5 |
| Base de datos | MySQL 8+ (driver `mysql2`, consultas parametrizadas) |
| Autenticación | JWT (`jsonwebtoken`) y bcrypt (`bcryptjs`) |
| Validación | Zod |
| Seguridad | Helmet, CORS y express-rate-limit |
| Imágenes | Multer (recepción del archivo) y Cloudinary (almacenamiento) |
| Pruebas | Jest y Supertest |
| Documentación | Colección de Postman (`docs/`) |

## Requisitos

- Node.js **20 o superior**
- MySQL **8 o superior** corriendo localmente (o una base en la nube, como Railway)
- npm

## Instalación y ejecución local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de variables de entorno y editarlo
cp .env.example .env
#    → define DB_USER, DB_PASSWORD y un JWT_SECRET largo y aleatorio

# 3. Iniciar en modo desarrollo (se reinicia al guardar cambios)
npm run dev
```

Antes del paso 3, crea la base de datos desde la terminal de MySQL (ejecutando `mysql` dentro de la carpeta del proyecto):

```sql
CREATE DATABASE techlearn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE techlearn;
SOURCE database/schema.sql;
```

> `schema.sql` **borra y recrea** todas las tablas.

La API queda disponible en `http://localhost:3000/api/v1` y se puede verificar con `GET /api/v1/health`.

### Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor en modo desarrollo (`node --watch`) |
| `npm start` | Servidor en modo producción |
| `npm test` | Ejecuta las pruebas automatizadas (no necesita base de datos) |

### Pruebas

Las pruebas (`tests/`) usan **Jest** y **Supertest**: hacen peticiones HTTP reales a la aplicación de Express, pero los repositorios se reemplazan por *mocks*, así que no tocan MySQL y se pueden correr en cualquier equipo. Cubren:

- Registro e inicio de sesión: contraseñas cifradas, rol forzado a `user`, mensajes que no revelan qué correos existen y cuentas deshabilitadas.
- Autenticación y roles: 401 sin token o con token alterado, 403 sin permiso, y tokens que dejan de funcionar al deshabilitar la cuenta.
- Reglas de negocio: cursos que nacen en borrador, el instructor tomado del token, propiedad de los cursos, visibilidad de borradores y acceso de estudiantes inscritos.
- Validación (400), JSON mal formado, cabeceras de seguridad y límite de intentos de login (429).
- Subida de imágenes: permisos por rol, tamaño máximo y archivos disfrazados de imagen (Cloudinary simulado).

### Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | `development` / `production` / `test` | `development` |
| `CORS_ORIGIN` | Orígenes permitidos (separados por coma) | `http://localhost:5173` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión a MySQL local | `localhost`, `3306`, `root`, …, `techlearn` |
| `DATABASE_URL` | Conexión completa en la nube (tiene prioridad sobre `DB_*`) | `mysql://user:pass@host:port/railway` |
| `JWT_SECRET` | Secreto para firmar los tokens | cadena aleatoria larga |
| `CLOUDINARY_URL` | Credenciales de Cloudinary para subir imágenes | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| `JWT_EXPIRES_IN` | Vigencia del token | `1h` |

## Primer administrador

Por seguridad, la API no permite registrarse como administrador. Para crear el primero:

1. Registra una cuenta normal con `POST /api/v1/auth/register`.
2. Asígnale el rol de administrador directamente en MySQL:

```sql
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'tu-correo@ejemplo.com';
```

A partir de ahí, el administrador registra a los instructores con `POST /api/v1/users/instructors`.

## Arquitectura

Arquitectura en capas; cada capa tiene una sola responsabilidad:

```
Petición → Route → Middlewares → Controller → Service → Repository → MySQL
```

```
src/
├── config/        # variables de entorno y pool de conexiones a MySQL
├── routes/        # endpoints y middlewares que aplica cada uno
├── middlewares/   # autenticación, roles, validación, rate limit y errores
├── validators/    # esquemas de validación (Zod)
├── controllers/   # reciben la petición y envían la respuesta
├── services/      # lógica de negocio (permisos, propiedad, reglas)
├── repositories/  # único lugar con consultas SQL
├── utils/         # JWT, errores, respuestas y constantes
├── app.js         # configuración de Express
└── server.js      # arranque del servidor
database/
└── schema.sql     # creación de tablas
docs/TechLearn.postman_collection.json
```

**Patrones aplicados:** Repository (acceso a datos aislado), cadena de middlewares (Chain of Responsibility) y servicios de dominio.

## Base de datos

Normalizada en **3NF**, con **bajas lógicas** (`is_active` / `status`): ningún registro se borra físicamente.

```mermaid
erDiagram
    roles ||--o{ users : "tiene"
    users ||--o| instructors : "perfil"
    instructors ||--o{ courses : "imparte"
    categories ||--o{ courses : "agrupa"
    users ||--o{ enrollments : "se inscribe"
    courses ||--o{ enrollments : "recibe"

    roles {
        tinyint id PK
        varchar name UK
    }
    users {
        int id PK
        varchar name
        varchar email UK
        varchar password_hash
        tinyint role_id FK
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    instructors {
        int id PK
        int user_id FK,UK
        text bio
        varchar photo_url
        varchar specialty
    }
    categories {
        smallint id PK
        varchar name UK
        varchar slug UK
        varchar description
        varchar image_url
        boolean is_active
    }
    courses {
        int id PK
        varchar title
        text description
        decimal price
        enum level
        varchar image_url
        smallint category_id FK
        int instructor_id FK
        enum status "draft | published | hidden"
        boolean is_active
    }
    enrollments {
        int id PK
        int user_id FK
        int course_id FK
        enum status "active | cancelled"
        datetime enrolled_at
    }
```

- El perfil del instructor vive en su propia tabla (1:1 con `users`) para no dejar columnas vacías en estudiantes y admins.
- `enrollments` tiene una llave única `(user_id, course_id)`: un usuario no puede inscribirse dos veces al mismo curso.
- Las imágenes no se guardan en la base de datos, solo su URL.

## Roles y permisos

| Acción | User | Instructor | Admin |
|---|:-:|:-:|:-:|
| Ver catálogo publicado | ✅ | ✅ | ✅ |
| Inscribirse / cancelar inscripción | ✅ | ❌ | ❌ |
| Crear cursos (nacen como `draft`) | ❌ | ✅ | ❌ |
| Editar cursos | ❌ | ✅ solo propios | ❌ |
| Dar de baja cursos | ❌ | ✅ solo propios | ✅ moderación |
| Ver estudiantes inscritos | ❌ | ✅ de sus cursos | ✅ |
| Publicar / ocultar / reactivar cursos | ❌ | ❌ | ✅ |
| Gestionar categorías | ❌ | ❌ | ✅ |
| Registrar instructores y habilitar o deshabilitar usuarios | ❌ | ❌ | ✅ |
| Estadísticas | ❌ | ❌ | ✅ |

## Endpoints

Base: `/api/v1`. Respuesta estándar: `{ success, message, data, meta? }`.

### Autenticación
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/register` | Público | Crea una cuenta con rol `user` |
| POST | `/auth/login` | Público | Devuelve `{ token, user }` |
| GET | `/auth/me` | Autenticado | Usuario de la sesión |

### Cursos
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/courses` | Público | Catálogo publicado. Query: `category`, `price=free\|paid`, `level`, `search`, `instructor`, `page`, `limit` |
| GET | `/courses/:id` | Público* | Detalle (*los no publicados solo los ve el dueño o el admin) |
| GET | `/courses/mine` | Instructor | Sus cursos en cualquier estado |
| POST | `/courses` | Instructor | Crear curso (`draft`) |
| PUT | `/courses/:id` | Instructor dueño | Editar contenido |
| DELETE | `/courses/:id` | Instructor dueño / Admin | Baja lógica |
| GET | `/courses/:id/students` | Instructor dueño / Admin | Estudiantes inscritos |
| GET | `/courses/admin` | Admin | Todos los cursos. Query: `status`, `includeInactive`, `onlyInactive`, `search`, `page`, `limit` |
| PATCH | `/courses/:id/status` | Admin | `{ "status": "published" \| "hidden" \| "draft" }` |
| PATCH | `/courses/:id/restore` | Admin | Reactivar curso dado de baja |

### Categorías
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/categories` | Público | Categorías activas |
| GET | `/categories/all` | Admin | Incluye inactivas |
| POST | `/categories` | Admin | Crear (el `slug` se genera del nombre si no se envía) |
| PUT | `/categories/:id` | Admin | Editar |
| DELETE | `/categories/:id` | Admin | Baja lógica (409 si tiene cursos activos) |
| PATCH | `/categories/:id/restore` | Admin | Reactivar |

### Instructores, inscripciones, usuarios y estadísticas
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/instructors` | Público | Directorio de instructores (los primeros son los destacados). Query: `search`, `page`, `limit` |
| GET | `/instructors/:id` | Público | Perfil público: especialidad, biografía, cursos publicados y estudiantes |
| GET / PUT | `/instructors/me` | Instructor | Ver / editar su perfil |
| POST | `/enrollments` | User | `{ "courseId": 3 }` (cursos de pago: pago simulado) |
| GET | `/enrollments/me` | User | Mis cursos |
| PATCH | `/enrollments/:id/cancel` | User | Cancelar inscripción |
| GET | `/users` | Admin | Listar usuarios. Query: `role`, `search`, `page`, `limit` |
| POST | `/users/instructors` | Admin | Registrar instructor (cuenta + perfil en una transacción) |
| PATCH | `/users/:id/status` | Admin | `{ "isActive": false }` habilitar / deshabilitar |
| GET | `/stats` | Admin | Totales, cursos por categoría y cursos más populares |
| POST | `/uploads/images` | Instructor, Admin | Sube una imagen (`multipart/form-data`: campo `image` y `folder` = `courses`, `categories` o `instructors`). Devuelve `{ url }` |

### Postman

Importa `docs/TechLearn.postman_collection.json`. Ejecuta primero la carpeta **"1. Autenticación"**: cada login guarda su token en las variables de la colección (`adminToken`, `instructorToken`, `userToken`). La carpeta **"6. Seguridad"** contiene peticiones que deben fallar (401, 403, 400, 404).

## Seguridad

- Contraseñas cifradas con **bcrypt**; nunca se devuelven en las respuestas.
- **JWT** con expiración. En cada petición también se verifica que la cuenta siga activa, así que deshabilitar a un usuario invalida su sesión de inmediato.
- **Control de acceso por rol** (`requireRole`) y **verificación de propiedad**: un instructor solo modifica sus cursos.
- El registro público **solo crea cuentas `user`**; los campos no permitidos (p. ej. `role`, `status`) se rechazan.
- **Consultas parametrizadas** contra inyección SQL. Los nombres de columna editables se toman de una lista blanca.
- **Validación** de body, query y params con Zod.
- **Helmet**, **CORS** restringido, límite de tamaño del body (100 KB).
- **Rate limiting** general y estricto en login y registro (10 intentos / 15 min).
- Mismo mensaje y tiempo de respuesta ante correo inexistente o contraseña incorrecta (evita la enumeración de usuarios).
- Errores internos sin detalles para el cliente en producción.

## Imágenes

Las imágenes (portadas de cursos, categorías y fotos de instructores) se suben desde el dispositivo del usuario:

1. El frontend envía el archivo a `POST /uploads/images`.
2. **Multer** lo recibe en memoria: máximo 2 MB, solo JPG, PNG o WEBP.
3. Se revisan los primeros bytes del archivo (su firma) para confirmar que de verdad es una imagen, porque el tipo que manda el navegador se puede falsificar.
4. Se sube a **Cloudinary**, que la reduce si es muy grande, y la API devuelve la URL pública.
5. El formulario guarda esa URL en el curso, la categoría o el perfil.

Se usa Cloudinary porque el disco de los servidores como Railway es temporal: lo que se guarda ahí se pierde en cada despliegue.

## Mejoras futuras

- Integración con una pasarela de pago (Stripe o Mercado Pago).
- Refresh tokens y recuperación de contraseña.
