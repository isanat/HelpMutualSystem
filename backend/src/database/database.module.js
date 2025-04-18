"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("./entities/user.entity");
const transaction_entity_1 = require("./entities/transaction.entity");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                name: 'default',
                useFactory: (configService) => ({
                    type: 'mysql',
                    host: configService.get('DATABASE_HOST', 'localhost'),
                    port: configService.get('DATABASE_PORT', 3306),
                    username: configService.get('DATABASE_USER', 'root'),
                    password: configService.get('DATABASE_PASSWORD', ''),
                    database: configService.get('DATABASE_NAME', 'integrazap'),
                    entities: [user_entity_1.User, transaction_entity_1.Transaction],
                    synchronize: false, // Apenas para desenvolvimento; desative em produção
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, transaction_entity_1.Transaction]),
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], DatabaseModule);
