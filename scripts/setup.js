// scripts/setup.js
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const zlib = require('zlib');
const bcrypt = require('bcrypt');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'config.json');
const CONFIG_EXAMPLE_PATH = path.join(__dirname, '..', 'config', 'example_config.json');

async function main() {
  console.log('=========================================');
  console.log('      HTD Developer Environment Setup     ');
  console.log('=========================================\n');

  // 1. Ensure config.json exists
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log('Copying config/example_config.json to config/config.json...');
    fs.copyFileSync(CONFIG_EXAMPLE_PATH, CONFIG_PATH);
  }

  const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

  // 2. Determine configuration
  let answer = '1';
  if (process.argv.includes('--sqlite')) {
    answer = '1';
  } else if (process.argv.includes('--mysql')) {
    answer = '2';
  } else {
    // Prompt for SQLite or MySQL configuration if running interactively
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    console.log('Choose development database dialect:');
    console.log('1) SQLite (Zero local configuration, recommended for quick testing) [default]');
    console.log('2) MySQL (Requires local MySQL server running)');

    answer = await question('\nEnter choice (1 or 2): ');
    rl.close();
  }

  if (answer.trim() === '2') {
    console.log('\nConfigured for MySQL in development.');
    console.log('Please ensure your local MySQL server is running and database configuration in config/config.json is correct.');
    configData.development.dialect = 'mysql';
    // Leave database configuration as is or prompt user to configure manually.
  } else {
    console.log('\nConfiguring SQLite for local development...');
    configData.development.dialect = 'sqlite';
    configData.development.storage = './database.sqlite';
    // Remove MySQL credentials from development config block for clarity
    delete configData.development.username;
    delete configData.development.password;
    delete configData.development.host;
    delete configData.development.database;
  }

  // Save the updated configuration
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf8');
  console.log('Saved config/config.json.');

  // Set environment variable to development
  process.env.NODE_ENV = 'development';

  // 3. Import models and sync DB schema
  console.log('\nSyncing database models...');
  const models = require('../models');
  
  try {
    await models.sequelize.sync({ force: true });
    console.log('Database schema synchronized successfully.');
  } catch (err) {
    console.error('Error syncing database:', err);
    process.exit(1);
  }

  // 4. Register a dummy tester account
  console.log('\nCreating tester user account...');
  const username = 'testuser';
  const password = 'password123';
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    await models.User.create({
      username: username,
      email: 'testuser@example.com',
      password: hashedPassword,
      view_index: 0,
      classified_file_count: 0
    });
    console.log(`Successfully created user: ${username} (password: ${password})`);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }

  // 6. Generate mock data files
  console.log('\nGenerating mock light curve data files...');
  const dataDir = path.join(__dirname, '..', 'data');
  const tutorialDataDir = path.join(__dirname, '..', 'tutorial_data');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(tutorialDataDir)) {
    fs.mkdirSync(tutorialDataDir, { recursive: true });
  }

  function generateMockCsv(isModel = false) {
    let csv = 'time,flux,flux_err\n';
    for (let t = 0; t < 100; t += 0.5) {
      const noise = (Math.random() - 0.5) * 0.02;
      // If it's a model/transit fit, show a smooth dip, otherwise raw noisy data
      const baseFlux = isModel
        ? (t > 40 && t < 60 ? 0.95 : 1.0)
        : (t > 40 && t < 60 ? 0.95 : 1.0) + noise;
      const err = '0.0100';
      csv += `${t.toFixed(1)},${baseFlux.toFixed(4)},${err}\n`;
    }
    return csv;
  }

  const dummyCsv = generateMockCsv(false);
  const dummyModelCsv = generateMockCsv(true);

  const csvBuffer = Buffer.from(dummyCsv, 'utf8');
  const modelCsvBuffer = Buffer.from(dummyModelCsv, 'utf8');

  // Compress using zlib deflate (matching Python's zlib.compress format)
  const compressedCsv = zlib.deflateSync(csvBuffer);
  const compressedModelCsv = zlib.deflateSync(modelCsvBuffer);

  // Write file_1 to file_10 in data/
  for (let i = 1; i <= 10; i++) {
    fs.writeFileSync(path.join(dataDir, `file_${i}.csv.zlib`), compressedCsv);
    fs.writeFileSync(path.join(dataDir, `models_${i}.csv.zlib`), compressedModelCsv);
  }
  console.log('Created file_1.csv.zlib to file_10.csv.zlib in data/');
  console.log('Created models_1.csv.zlib to models_10.csv.zlib in data/');

  // Write file_0 to file_9 in tutorial_data/
  for (let i = 0; i < 10; i++) {
    fs.writeFileSync(path.join(tutorialDataDir, `file_${i}.csv.zlib`), compressedCsv);
    fs.writeFileSync(path.join(tutorialDataDir, `models_${i}.csv.zlib`), compressedModelCsv);
  }
  console.log('Created file_0.csv.zlib to file_9.csv.zlib in tutorial_data/');

  // Make sure database connection is closed
  await models.sequelize.close();

  console.log('\n=========================================');
  console.log('       Setup completed successfully!     ');
  console.log('=========================================');
  console.log('\nTo run your local server, run:');
  console.log('  npm run start-dev');
  console.log('\nOpen your browser and navigate to:');
  console.log('  http://localhost:8000');
  console.log('\nLog in with:');
  console.log('  Username: testuser');
  console.log('  Password: password123');
  console.log('=========================================\n');
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
