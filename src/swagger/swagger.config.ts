import { SwaggerConfig } from "./swagger.interface";


export const SWAGGER_CONFIG: SwaggerConfig = {
  title: process.env.APP_NAME,
  description: `API documentation for ${process.env.APP_NAME}`,
  version: require("../../package.json").version,
  licenseName: require("../../package.json").license,
  licenseURL: "",
  termsOfService: "",
  contactName: "",
  contactURL: "",
  contactEmail: ""
};