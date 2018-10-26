import "../assets/styles/index.scss";
import api from './models/db';
import Configurator from "./Configurator";

const textureList = [
    {
        src: '../assets/images/1.jpg',
        name: 'Texture 1'
    },
    {
        src: '../assets/images/2.jpg',
        name: 'Texture 2'
    }
];


window.addEventListener('load', () => {

    const app = new Configurator(api);

    document.getElementById('setCamFront').addEventListener('click', (e) => {
        app.editFrontText();
        e.target.style.display = 'none';
        document.getElementById('applyText').style.display = 'block';
    });
    document.getElementById('applyText').addEventListener('click', (e) => {
        app.setFrontText();
        e.target.style.display = 'none';
        document.getElementById('setCamFront').style.display = 'block';
    });

    const textureControls = document.querySelector('.texture-controls');
    textureList.forEach((item) => {
        const button = document.createElement('button');
        button.innerText = item.name;
        button.addEventListener('click', () => {
            app.setTexture(item.src);
        });
        textureControls.appendChild(button);
    });
});
