import {TokenI} from "./models/Token";
import {DeviceI} from "./models/Device";
import {ClientI} from "./models/Client";

export type AuthInfo = Omit<Omit<TokenI, "device">, "client"> & { device: DeviceI, client: ClientI };


declare module "express-serve-static-core" {
    interface Request {
        auth?: AuthInfo;
    }
}