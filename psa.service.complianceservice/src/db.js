const { config } = require('./config');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.database,
  dialect: config.database.dialect,
  define: {
    underscored: true,
    timestamps: true,
  },
  logging: false,
  dialectOptions: {
    ssl: config.database.ssl,
  },
});

// Definition of database models

const Compliance = sequelize.define(
  'Compliance',
  {
    mappingId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    study: { type: DataTypes.TEXT, allowNull: false },
    timestamp: {
      type: 'TIMESTAMP',
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    complianceText: { type: DataTypes.TEXT, allowNull: false },
    username: { type: DataTypes.TEXT },
    ids: { type: DataTypes.TEXT },
    firstname: { type: DataTypes.TEXT },
    lastname: { type: DataTypes.TEXT },
    location: { type: DataTypes.TEXT },
    birthdate: { type: DataTypes.DATEONLY },
    complianceApp: { type: DataTypes.BOOLEAN, defaultValue: false },
    complianceBloodsamples: { type: DataTypes.BOOLEAN, defaultValue: false },
    complianceLabresults: { type: DataTypes.BOOLEAN, defaultValue: false },
    complianceSamples: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { underscored: true }
);

const QuestionnaireCompliance = sequelize.define('QuestionnaireCompliance', {
  placeholder: { type: DataTypes.TEXT, allowNull: false },
  value: { type: DataTypes.BOOLEAN, defaultValue: false },
});

const QuestionnaireTextCompliance = sequelize.define(
  'QuestionnaireTextCompliance',
  {
    placeholder: { type: DataTypes.TEXT, allowNull: false },
    value: { type: DataTypes.STRING, defaultValue: false },
  }
);

Compliance.hasMany(QuestionnaireCompliance);
Compliance.hasMany(QuestionnaireTextCompliance);

const ComplianceText = sequelize.define('ComplianceText', {
  study: { type: DataTypes.TEXT, allowNull: false, unique: true },
  text: { type: DataTypes.TEXT, allowNull: false },
  to_be_filled_by: { type: DataTypes.TEXT, allowNull: false },
});

const ComplianceQuestionnairePlaceholder = sequelize.define(
  'ComplianceQuestionnairePlaceholder',
  {
    study: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.TEXT, allowNull: false },
    placeholder: { type: DataTypes.TEXT, allowNull: false },
    label: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    indexes: [{ unique: true, fields: ['study', 'placeholder'] }],
  }
);

module.exports = {
  default: sequelize,
  sequelize,
  Compliance,
  QuestionnaireCompliance,
  QuestionnaireTextCompliance,
  ComplianceText,
  ComplianceQuestionnairePlaceholder,
};
