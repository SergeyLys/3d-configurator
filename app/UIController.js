export default new class UIController {
    constructor() {
        this.buttons = [
            {
                type: "edit",
                text: "Редактировать"
            },
            {
                type: "apply",
                text: "Применить"
            }
        ]
    }

    showButton(buttonType, action) {
        if (!document.getElementById(buttonType)) {
            const buttonObj = this.buttons.find((btn) => btn.type === buttonType);
            const buttonNode = document.createElement('button');
            buttonNode.innerText = buttonObj.text;
            buttonNode.setAttribute('id', buttonObj.type);
            document.body.appendChild(buttonNode);
            buttonNode.style.position = 'absolute';
            buttonNode.style.top = '0px';
            buttonNode.style.right = '0px';
            buttonNode.style.zIndex = '1';

            if (typeof action === 'function') {
                buttonNode.addEventListener('click', action);
            }
        }
    }

    removeButton(buttonType) {
        if (document.getElementById(buttonType)) {
            document.getElementById(buttonType).remove();
        }
    }
}
