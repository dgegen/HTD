# HTD Website

This project is a web application designed for data classification and visualization. It includes various components such as data fetching, parsing, and rendering on the client side, as well as server-side handling of file requests and user authentication.

## Installation


1. Clone the repository
    ```bash
    git clone git@github.com:dgegen/HTD.git
    cd HTD
    ```
2. Install **[Node.js](https://nodejs.org/en/download)**
3. Install dependencies
    ```bash
    npm install
    ```

4. Download and install **[MySQL](https://dev.mysql.com/downloads/installer/)**
5. Set Up the MySQL Database
    1. Log into the MySQL Database
        ```sql
        mysql -u your_username -p
        ```
    2. Create a New Database (e.g. `htd`):
        ```sql
        CREATE DATABASE htd;
        quit;
        ```
    3. Import Database Structure
        ```bash
        mysql -u your_username -p htd < migrations/database_structure.sql
        ```
6. Change `config/config.json`. This might including changing the `host` (e.g. to `localhost`), changing the `username`, the `password` of the MySQL database, and the `max_file_id` to the number files you want to provide in `data` to be classified by the users. `__password__` was used to indicate the case where the database has no password.

7. Add some data
    ```bash
    cd data
    ```
    Example files can be [found here](https://polybox.ethz.ch/index.php/s/JO6H1xQd5cJ2ONw). Light curve files should be in CSV format and contain the columns, `time`, `flux`, and `flux_err`. Furthermore, they should be compressed for efficient storage, e.g. using `zlib.compress`.


## Usage

From the main project directory, run
```bash
npm start server.js
```
Subsequently, open your browser and navigate to `http://localhost:8000`.

Now the only thing left to do is to create an account, login and start classifying!

## License
This project is licensed under the MIT License.


## Key Components

### Server

- **[server.js](server.js)**: Configures and starts the Express server, sets up middleware, and defines routes for handling requests.

### Public

- **[classification.js](public/js/classification.js)**: Contains the `NetworkManager` class for handling data fetching and parsing on the client side.
- **[dataManager.js](public/js/dataManager.js)**: Manages data models and fetching operations on the client side.

### Views
- **[home/index.ejs](views/home/index.ejs)**: The view template for the home page.
- **[classify/classify.ejs](views/classify/classify.ejs)**: The view template for the classification page.

### Controllers

- **[account_controller.js](controllers/account_controller.js)**: Manages user account-related operations.
- **[classify_controller.js](controllers/classify_controller.js)**: Handles classification-related requests.
- **[file_controller.js](controllers/file_controller.js)**: Manages file requests and responses.
- **[home_controller.js](controllers/home_controller.js)**: Handles requests for the home page.
- **[post_controller.js](controllers/post_controller.js)**: Manages POST requests for data submissions.
