const fs = require('fs');
const path = require('path');


// =====================================
// ANALYTICS ROOT
// =====================================

const ANALYTICS_DIR =
  __dirname;


// =====================================
// IGNORE FOLDERS
// =====================================

const ignoredFolders = [

  'helpers',
  'contracts',
  'outputs',
  'runtime_profiles'

];


// =====================================
// GET MODULES
// =====================================

const modules = fs.readdirSync(
  ANALYTICS_DIR
)

.filter(name => {

  const fullPath = path.join(
    ANALYTICS_DIR,
    name
  );

  return (

    fs.statSync(fullPath).isDirectory()

    &&

    !ignoredFolders.includes(name)

  );

});


// =====================================
// RUN MODULE
// =====================================

function runModule(moduleName) {

  const scriptsDir = path.join(

    ANALYTICS_DIR,

    moduleName,

    'scripts'

  );

  // =====================================
  // SKIP IF NO SCRIPTS
  // =====================================

  if (!fs.existsSync(scriptsDir)) {

    console.log(
      `⚠️ ${moduleName} sin carpeta scripts`
    );

    return;

  }

  // =====================================
  // GET JS FILES
  // =====================================

  const files = fs.readdirSync(scriptsDir)

    .filter(file =>
      file.endsWith('.js')
    );

  // =====================================
  // EMPTY MODULE
  // =====================================

  if (files.length === 0) {

    console.log(
      `⚠️ ${moduleName} sin scripts`
    );

    return;

  }

  // =====================================
  // RUN FILES
  // =====================================

  files.forEach(file => {

    const fullPath = path.join(
      scriptsDir,
      file
    );

    try {

      console.log(
        `\n🚀 ${moduleName}/${file}`
      );

      require(fullPath);

    }

    catch (error) {

      console.error(
        `\n❌ Error en ${moduleName}/${file}`
      );

      console.error(error);

    }

  });

}


// =====================================
// RUN ALL MODULES
// =====================================

modules.forEach(runModule);


// =====================================
// RUN RUNTIME PROFILES LAST
// =====================================

console.log(
  '\n🧠 Ejecutando runtime_profiles...\n'
);

runModule('runtime_profiles');


// =====================================
// DONE
// =====================================

console.log(
  '\n✅ Todos los analytics procesados\n'
);