import winston, { transport } from 'winston';

const transports: transport[] = [
  new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
  new winston.transports.File({ filename: './logs/combined.log' }),
];

if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
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
    winston.format.json()
  ),
  transports: transports,
});

export default logger;