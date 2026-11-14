// Variables de entorno para las pruebas: no se usa la base de datos real.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'clave-solo-para-pruebas';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLOUDINARY_URL = 'cloudinary://clave:secreto@cuenta-de-prueba';
