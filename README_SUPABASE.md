
# Integración de Supabase

Este proyecto ha sido configurado para usar Supabase para autenticación y base de datos.
El proyecto en Supabase se llama "iMegaApp".

## Configuración

Crea un archivo llamado `.env.local` en la raíz del proyecto y agrega el siguiente contenido:

```env
VITE_SUPABASE_URL=https://scpiblaqlcyiwhjluxgl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcGlibGFxbGN5aXdoamx1eGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjg0OTMsImV4cCI6MjA4MjcwNDQ5M30.RMh59boAeUVaymu_Psic6TyZhgdMRifTk0fIFxaVo8Q
```

## Estructura de la Base de Datos

Se han creado las siguientes tablas en Supabase:

- **profiles**: Perfiles de usuario (rol, nivel de membresía, puntos). Se crea automáticamente al iniciar sesión por primera vez.
- **products**: Inventario de productos (iPhones, etc).
- **purchases**: Historial de compras.
- **reward_history**: Historial de puntos y recompensas.

## Autenticación

El sistema usa "Magic Link" (Enlace Mágico). El usuario ingresa su correo y recibe un enlace para iniciar sesión.
Al registrarse, se le asigna automáticamente el rol 'client' y nivel 'Bronce'.

## Próximos pasos

- Los administradores deben asignarse manualmente el rol 'admin' en la tabla `profiles` de Supabase para tener acceso a gestión.
