# Programadores Aumentados
Se ha creado un repositorio en GitHub con la IA Gemini para anonimizar y desanonimizar información sensible. Este proyecto protege la privacidad al procesar datos antes de enviarlos a la IA y permite restaurarlos cuando sea necesario.

# Implementacion: Privacy Vault
Un servicio de API que permite interactuar de forma segura con modelos de lenguaje (LLM) protegiendo la información sensible mediante tokenización.

## Características

- Anonimización de datos sensibles (nombres, emails, teléfonos)
- Integración con Google Gemini
- Persistencia de tokens en MongoDB Atlas
- Endpoints para anonimización y des-anonimización
- Chat seguro con LLM preservando la privacidad

## Requisitos Previos

- Node.js (v14 o superior)
- MongoDB Atlas cuenta (gratuita)
- Google Gemini API key

## Instalación

1. Clonar el repositorio:

git clone https://github.com/hassanmarquez/ProgramadoresAumentados.git

bash

cd privacy-vault

2. Instalar dependencias:

bash

npm install

3. Crear archivo `.env` en la raíz del proyecto:

MONGODB_URI=tu_mongodb_atlas_uri

GEMINI_API_KEY=tu_gemini_api_key

4. Iniciar el servidor:

bash

node server.js

## Endpoints

### 1. Anonimizar Mensaje
POST `/anonymize`

bash

<code>
curl -X POST http://localhost:3001/anonymize \
-H "Content-Type: application/json" \
-d '{"message":"Contactar a Juan Perez: jperez@email.com, 3001234567"}'
</code>


### 2. Des-anonimizar Mensaje
POST `/deanonymize`

bash

<code>
curl -X POST http://localhost:3001/deanonymize \
-H "Content-Type: application/json" \
-d '{"anonymizedMessage":"Contactar a NAME_abc123: EMAIL_def456, PHONE_ghi789"}'
</code>

### 3. Chat Seguro con Gemini
POST `/secureChatGemini`

bash

<code>
curl -X POST http://localhost:3001/secureChatGemini \
-H "Content-Type: application/json" \
-d '{"prompt":"Genera un correo para Juan Perez (jperez@email.com)"}'
</code>

## Casos de Prueba Manual

### Caso 1: Email de Entrevista

<code>
curl -X POST http://localhost:3001/secureChatGemini \
-H "Content-Type: application/json" \
-d '{"prompt":"Genera un correo para Hassan Marquez con email hassanmarquez@gmail.com y teléfono 3152319157 invitándolo a una entrevista de trabajo para el puesto de desarrollador senior"}'
</code>

### Caso 2: Múltiples Personas

bash

<code>
curl -X POST http://localhost:3001/secureChatGemini \
-H "Content-Type: application/json" \
-d '{"prompt":"Organiza una reunión entre Maria Lopez (mlopez@empresa.com), Juan Torres (jtorres@empresa.com) y Carlos Ruiz (cruiz@empresa.com) para discutir el proyecto de privacidad"}'
</code>


### Caso 3: Información de Contacto

bash

<code>
curl -X POST http://localhost:3001/secureChatGemini \
-H "Content-Type: application/json" \
-d '{"prompt":"Actualiza la información de contacto de Ana Martinez: email anterior amartinez@old.com, nuevo email ana.martinez@new.com, nuevo teléfono 3157894561"}'
</code>

## Estructura de Respuestas

Las respuestas del endpoint `/secureChatGemini` incluyen:

json

<code>
{
"originalPrompt": "Prompt original con datos sensibles",
"anonymizedPrompt": "Prompt con datos tokenizados",
"completion": "Respuesta de Gemini des-anonimizada"
}
</code>

## Notas de Seguridad

- Los tokens se almacenan en MongoDB Atlas
- La información sensible nunca se envía al LLM
- Los tokens expiran después de 24 horas
- Se requiere autenticación para MongoDB Atlas

## Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Crea un Pull Request
