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


createTemplate();

async function createTemplate() {
   if (!confirmCreateDirectory) {
      console.log('Aborted creating a new template');
      return;
   }

   const source = template;
   const destination = path.join(CURR_DIR);
   const routesPath = path.join(destination, 'routes');
   const modelsPath = path.join(destination, 'models');

   try {
      await copyTemplateFiles(source, destination);
      await createRouteDirectories(source, routesName, routesPath);
      await updateRouteIndexFile(routesName, routesPath);
      await createModelFiles(source, modelsName, modelsPath);
      await installRequiredPackages(destination, packageNames);
      console.log('Project setup completed!');
      console.log(`add "start": "node ./bin/www" to package.json, remove main script`);
   } catch (err) {
      console.error(err);
   }
}

async function copyTemplateFiles(source, destination) {
   await fse.copy(source, destination, { filter: customFilter });
}

async function createRouteDirectories(source, routesName, routesPath) {
   if (!routesName.length) return;
   const routes = routesName.split(' ');
   for (const route of routes) {
      const routeDir = path.join(routesPath, route);
      fse.mkdirSync(routeDir);
      fse.copySync(path.join(source, 'routes'), routeDir, { filter: excludeIndexFile });
      fse.renameSync(path.join(routeDir, 'index-template.js'), path.join(routeDir, 'index.js'));
   }
}

async function updateRouteIndexFile(routesName, routesPath) {
   if (!routesName.length) return;
   const routes = routesName.split(' ');
   const indexRouteText = fse.readFileSync(path.join(routesPath, 'index.js'), 'utf-8');
   const importLines = routes.map(route => `const ${route}Routes = require('./${route}/index')`).join('\n') + '\n';
   const useLines = routes.map(route => `router.use('/${route}', ${route}Routes)`).join('\n') + '\n';
   const updatedIndexRouteText = indexRouteText
      .replace('//!!import', importLines)
      .replace('//!!use\n', useLines)
      .replace('ProjectName', projectName);
   fse.writeFileSync(path.join(routesPath, 'index.js'), updatedIndexRouteText);
}

async function createModelFiles(source, modelsName, modelsPath) {
   if (!modelsName.length) return;
   const models = modelsName.split(' ');
   for (const model of models) {
      const modelText = fse.readFileSync(path.join(source, 'models', 'table.js'), 'utf-8');
      const updatedModelText = modelText
         .replace(/TableName1/g, inflection.capitalize(model))
         .replace(/TableName2/g, inflection.camelize(model));
      fse.writeFileSync(path.join(modelsPath, `${model}.js`), updatedModelText);
   }
}

async function installRequiredPackages(destination, packageNames) {
   await installPackages(path.join(destination), packageNames);
   console.log('Packages installed', packageNames);
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

function customFilter(src, dest) {
   if (src.includes('table.js') || src.includes('index-template.js')) {
      return false;
   }
   return true;
}

function excludeIndexFile(src, dest) {
   return !src.includes('index.js');
}