# Project Name

## Description
This project is a TypeScript-based application that includes a bot and an Express server. The bot handles various commands and interactions, while the server manages counts and goals.

## Technologies Used
- TypeScript
- Node.js
- Express
- Mongoose
- Yarn
- npm

## Installation

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2. Install dependencies:
    ```sh
    yarn install
    ```
3. Environment Variables

    Create a `.env` file in the root directory and add the following variables:

   - `TELEGRAM_TOKEN`: Token for the Telegram bot.
   - `SERVER_URL`: URL for the server.
   - `PORT`: Port number for the Express server.
   - `MONGO_URL`: MongoDB connection string.
   - `GOOGLE_AI_KEY`: API key for Google AI.
   - `SECRET_KEY`: Secret key for the application.

    Example `.env` file:
    ```env
    TELEGRAM_TOKEN=your-telegram-token
    SERVER_URL=http://localhost:4000
    PORT=4000
    MONGO_URL=mongodb://your-mongo-url
    GOOGLE_AI_KEY=your-google-ai-key
    SECRET_KEY=your-secret-key
    ```

4. The bot will automatically start and listen for commands.

## Bot Commands

- `/missed`: Prompts the user to choose a period for missed days.
- `/notification_on`: Turns on notifications for the chat.
- `/notification_off`: Turns off notifications for the chat.
- `/quote`: Sends the quote of the day.
- `/rec`: Sends a recommendation for the week.

## API Endpoints

### Get Counts History
- **URL**: `/count`
- **Method**: `GET`
- **Query Parameters**: 
  - `page` (optional): Page number for pagination.
  - `chatId` (required): ID of the chat.

### Get Total Count for a Goal
- **URL**: `/count/total/:goalId`
- **Method**: `GET`
- **Query Parameters**: 
  - `period` (optional): Period for the count (default is `day`).
  - `minus` (optional): Subtracts the specified number of periods from the current date.

### Add a Count
- **URL**: `/count`
- **Method**: `POST`
- **Body Parameters**:
  - `goalId` (required): ID of the goal.
  - `amount` (required): Amount to add to the count.

## Error Handling
All errors are logged to the console, and appropriate error messages are returned to the client.

## License
This project is licensed under the MIT License.