const express = require('express'); // Crear aplicaciones web con Express.
const bodyParser = require('body-parser'); // Cambiar el tipo de datos en las solicitudes HTTP.
const fs = require('fs'); // Interacción con el sistema de archivos (leer y escribir).
const path = require('path'); // Manejar rutas de archivos y directorios.

const app = express(); // Crear una instancia de la aplicación Express.
const puerto = 3000; // Definir el puerto

app.use(express.json());

// Ruta al archivo JSON dentro de la carpeta "data"
const animeFilePath = path.join(__dirname, 'data', 'anime.json');

//*get animes por id
app.get('/api/animes/:id', (req, res) => {
  const animeId = req.params.id; // Captura el ID desde la URL

  // Leer el archivo JSON
  fs.readFile(animeFilePath, 'utf8', (err, data) => {
      if (err) {
          return res.status(500).json({ error: "Error al leer el archivo JSON" });
      }

      const animes = JSON.parse(data);

      // Buscar el anime por ID
      const anime = animes[animeId];

      if (anime) {
          res.json({ id: animeId, ...anime });
      } else {
          res.status(404).json({ error: `No se encontró un animé con el ID: ${animeId}` });
      }
  });
});

app.get('/api/animes/nombre/:nombre', (req, res) => {
  const animeNombre = req.params.nombre.toLowerCase(); // Captura el nombre y lo normaliza

  fs.readFile(animeFilePath, 'utf8', (err, data) => {
      if (err) {
          return res.status(500).json({ error: "Error al leer el archivo JSON" });
      }

      const animes = JSON.parse(data);

      // Filtrar buscando el nombre (ignorando mayúsculas y minúsculas)
      const resultado = Object.entries(animes).find(([id, anime]) => 
          anime.nombre.toLowerCase() === animeNombre
      );

      if (resultado) {
          const [id, anime] = resultado;
          res.json({ id, ...anime });
      } else {
          res.status(404).json({ error: `No se encontró un animé con el nombre: ${req.params.nombre}` });
      }
  });
});


// Ruta GET para listar todos los animes
app.get('/api/animes', (req, res) => {
  // Leer el archivo JSON
  fs.readFile(animeFilePath, 'utf8', (err, data) => {
      if (err) {
          return res.status(500).json({ error: "Error al leer el archivo JSON" });
      }

      try {
          const animes = JSON.parse(data); // Convertir el JSON a objeto
          res.json(animes);               // Devolver el contenido completo
      } catch (parseError) {
          res.status(500).json({ error: "Error al parsear el archivo JSON" });
      }
  });
});
// Ruta POST para agregar animes
app.post('/api/animes', (req, res) => {
    // Leer el archivo actual anime.json
    fs.readFile(animeFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error al leer el archivo JSON" });
        }

        try {
            const animes = JSON.parse(data); // Convertir JSON en objeto
            const requestData = req.body;    // Datos enviados desde Postman

            // Verificar si el cuerpo es un array o un objeto individual
            const newAnimes = Array.isArray(requestData) ? requestData : [requestData];

            // Validar cada objeto
            for (const anime of newAnimes) {
                if (!anime.nombre || !anime.genero || !anime.año || !anime.autor) {
                    return res.status(400).json({ error: "Todos los campos son obligatorios: nombre, genero, año, autor" });
                }
            }

            // Calcular ID dinámico
            const currentId = Object.keys(animes).length;
            newAnimes.forEach((anime, index) => {
                const newId = currentId + index + 1;
                animes[newId] = anime;
            });

            // Escribir el archivo actualizado
            fs.writeFile(animeFilePath, JSON.stringify(animes, null, 4), (err) => {
                if (err) {
                    return res.status(500).json({ error: "Error al escribir en el archivo JSON" });
                }
                res.status(201).json({ message: "Animes agregados correctamente", animes: newAnimes });
            });
        } catch (parseError) {
            res.status(500).json({ error: "Error al parsear el archivo JSON" });
        }
    });
});

//* editar un anime
app.put('/api/animes/:id', (req, res) => {
  const animeId = req.params.id; // Captura el ID desde la URL
  const nuevosDatos = req.body; // Captura los datos enviados en el cuerpo de la petición

  fs.readFile(animeFilePath, 'utf8', (err, data) => {
      if (err) {
          return res.status(500).json({ error: "Error al leer el archivo JSON" });
      }

      const animes = JSON.parse(data);

      // Verificar si el anime con el ID existe
      if (!animes[animeId]) {
          return res.status(404).json({ error: `No se encontró un animé con el ID: ${animeId}` });
      }

      // Actualizar las propiedades existentes
      animes[animeId] = { ...animes[animeId], ...nuevosDatos };

      // Guardar los cambios en el archivo
      fs.writeFile(animeFilePath, JSON.stringify(animes, null, 4), 'utf8', (writeErr) => {
          if (writeErr) {
              return res.status(500).json({ error: "Error al guardar los cambios en el archivo JSON" });
          }

          res.json({ mensaje: "Animé actualizado correctamente", anime: animes[animeId] });
      });
  });
});

//*ELIMINAR UN MONO Y REORDENAR LISTA
app.delete('/api/animes/:id', (req, res) => {
  const animeId = req.params.id; // Captura el ID desde la URL

  fs.readFile(animeFilePath, 'utf8', (err, data) => {
      if (err) {
          return res.status(500).json({ error: "Error al leer el archivo JSON" });
      }

      const animes = JSON.parse(data);

      // Verificar si el ID existe
      if (!animes[animeId]) {
          return res.status(404).json({ error: `No se encontró un animé con el ID: ${animeId}` });
      }

      // Eliminar el anime
      delete animes[animeId];

      // Reordenar los IDs consecutivamente
      const animesReordenados = {};
      let nuevoId = 1;

      for (const key in animes) {
          animesReordenados[nuevoId] = animes[key];
          nuevoId++;
      }

      // Guardar el objeto reordenado en el archivo
      fs.writeFile(animeFilePath, JSON.stringify(animesReordenados, null, 4), 'utf8', (writeErr) => {
          if (writeErr) {
              return res.status(500).json({ error: "Error al guardar los cambios en el archivo JSON" });
          }

          res.json({ mensaje: "Animé eliminado y lista reordenada correctamente", animes: animesReordenados });
      });
  });
});

app.listen(puerto, () => {
    console.log(`Servidor escuchando en http://localhost:${puerto}`);
});