import winston, { transport } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export function initializeLogger() {
  // Define an array to hold the transport streams for Winston
  const transports: (DailyRotateFile | winston.transports.ConsoleTransportInstance)[] = [
    // File transport for error logs
    new DailyRotateFile({
      filename: './logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '3d',
      level: 'error'
    }),
    // File transport for combined logs
    new DailyRotateFile({
      filename: './logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '3d'
    }),
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