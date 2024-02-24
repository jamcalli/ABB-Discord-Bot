import winston, { transport } from 'winston';

export function initializeLogger() {
  const transports: transport[] = [
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: './logs/combined.log' }),
  ];

  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
          }),
          winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
        )
      })
    );
  }

  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: transports,
  });

  return logger;
}