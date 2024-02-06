#!/usr/bin/env node
const readLineSync = require("readline-sync")
const path = require('path')
const fse = require('fs-extra')
const { exec } = require('child_process');
const inflection = require('inflection');

const CURR_DIR = process.cwd();
const template = path.join(__dirname, 'templates', 'express-sequelize')

const projectName = readLineSync.question('Enter projectName: ', {
   limit: inp => inp.length > 0,
   limitMessage: 'Please enter project name'
});

const routesName = readLineSync.question('Enter route names (space seprated): ');

const modelsName = readLineSync.question('Enter model names (space seprated): ');

const confirmCreateDirectory = readLineSync.keyInYN(`Do you want to continue?`);

const packageNames = [
   "bcryptjs",
   "body-parser",
   "connect-flash",
   "cookie-parser",
   "dotenv",
   "express",
   "express-handlebars",
   "express-session",
   "jsonwebtoken",
   "multer",
   "mysql2",
   "nodemailer",
   "passport",
   "passport-jwt",
   "sequelize",
   "validator",
   "http-errors",
   "debug"
];

if (confirmCreateDirectory) {

   const source = template
   const destination = path.join(CURR_DIR);
   const routesPath = path.join(destination, 'routes')
   const modelsPath = path.join(destination, 'models')
   fse.copy(source, destination, {
      filter: (src, dest) => {
         if (src.includes('table.js')) return false
         if (src.includes('index-template.js')) return false
         return true
      }
   })
      .then(() => {
         if (routesName.length) {
            let routes = routesName.split(' ')
            routes.forEach((route) => {
               fse.mkdirSync(path.join(routesPath, route))
               fse.copySync(path.join(source, 'routes'), path.join(routesPath, route), {
                  filter(src, dest) {
                     if (src.includes('index.js')) return false
                     return true
                  }
               })
               fse.renameSync(path.join(routesPath, route, 'index-template.js'), path.join(routesPath, route, 'index.js'))
            })
            let indexRouteText = fse.readFileSync(path.join(routesPath, 'index.js'), 'utf-8')
            let importLines = ''
            routes.forEach((route) => {
               importLines += `const ${route}Routes = require('./${route}/index')\n`
            })
            importLines += '\n'
            let useLines = ''
            routes.forEach((route) => {
               useLines += `router.use('/${route}',${route}Routes)\n`
            })
            useLines += '\n'
            console.log(importLines);
            console.log(useLines);
            indexRouteText = indexRouteText.replace('//!!import', importLines)
            indexRouteText = indexRouteText.replace('//!!use\n', useLines)
            indexRouteText = indexRouteText.replace('ProjectName', projectName)
            fse.writeFileSync(path.join(routesPath, 'index.js'), indexRouteText)
         }
      })
      .then(() => {
         if (modelsName.length) {
            let models = modelsName.split(' ')
            models.forEach((model) => {
               let modelText = fse.readFileSync(path.join(source, 'models', 'table.js'), 'utf-8')
               modelText = modelText.replaceAll('TableName1', inflection.capitalize(model))
               modelText = modelText.replaceAll('TableName2', inflection.camelize(model))
               fse.writeFileSync(path.join(modelsPath, `${model}.js`), modelText)
            })
         }
      })
      .then(() => {
         console.log(destination);
         installPackages(path.join(destination), packageNames)
      })
      .then(() => {
         console.log('Packages installed', packageNames);
      })
      .then(() => console.log(`Project setup completed! ;)`))
      .catch(err => console.error(err));

} else {
   console.log('Aborted creating a new template');
}


function installPackages(directory, packages) {
   return new Promise((resolve, reject) => {
      const npmInstall = exec(`npm install ${packages.join(' ')}`, { cwd: directory });

      npmInstall.stdout.on('data', (data) => {
         console.log(data);
      });

      npmInstall.stderr.on('data', (data) => {
         console.error(data);
      });

      npmInstall.on('close', (code) => {
         if (code === 0) {
            resolve();
         } else {
            reject(`npm install exited with code ${code}`);
         }
      });
   });
}