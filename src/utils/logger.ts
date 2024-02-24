import winston, { transport } from 'winston';

export function initializeLogger() {
  // Define an array to hold the transport streams for Winston
  const transports: transport[] = [
    // File transport for error logs
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    // File transport for combined logs
    new winston.transports.File({ filename: './logs/combined.log' }),
  ];

  // If the environment is not production, add a console transport
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(), // Colorize the output
          winston.format.timestamp({ // Add timestamp to the output
            format: 'YYYY-MM-DD HH:mm:ss'
          }),
          winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`) // Define the format of the output
        )
      })
    );
  }

  // Create a new Winston logger with the transports
  const logger = winston.createLogger({
    level: 'info', // Log level
    format: winston.format.combine(
      winston.format.timestamp({ // Add timestamp to the output
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`) // Define the format of the output
    ),
    transports: transports, // Add the transports to the logger
  });

  // Return the logger
  return logger;
}