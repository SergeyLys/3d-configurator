import "../assets/styles/index.scss";
import api from './models/db';
import Configurator from "./Configurator";

window.addEventListener('load', () => {
    new Configurator(api);
});
