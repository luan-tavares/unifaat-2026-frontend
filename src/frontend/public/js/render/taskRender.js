// TODO (TF): Importar taskToggleHandler e taskDeleteHandler
import taskToggleHandler from "../listeners/taskToggleHandler.js";
import taskDeleteHandler from "../listeners/taskDeleteHandler.js";

export default function taskRender(task, idUser) {
    const liElement = document.createElement("li");
    liElement.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
    liElement.taskId = task.id;
    liElement.userId = idUser;

    const nameElement = document.createElement("span");
    nameElement.innerText = task.name;
    nameElement.classList.add("flex-grow-1");

    liElement.append(nameElement);

    const checkboxElement = document.createElement("input");
    checkboxElement.type = "checkbox";
    checkboxElement.classList.add("form-check-input");
    checkboxElement.checked = task.is_done;
    checkboxElement.addEventListener("change", taskToggleHandler);
    liElement.prepend(checkboxElement);

    if (task.is_done) {
        nameElement.classList.add("text-decoration-line-through", "text-muted");
    }

    const buttonDeleteElement = document.createElement("button");
    buttonDeleteElement.classList.add("btn", "btn-danger", "btn-sm");
    buttonDeleteElement.innerText = "Excluir";
    buttonDeleteElement.addEventListener("click", taskDeleteHandler);
    liElement.append(buttonDeleteElement);

    // TODO (TF): Adicionar checkbox para marcar concluída
    /*
    / Notas felipe:
    // 1. Cria um elemento <input> do zero, ainda "solto" na memória
    //(ele só aparece na tela quando for anexado a algo que já está no DOM)
    const checkboxElement = document.createElement("input");

    // 2. Define o atributo "type" como "checkbox"
    //Um <input> sem "type" vira um campo de texto por padrão.
    //Ao definir type="checkbox", o navegador renderiza aquele
    //quadradinho clicável, com estado marcado/desmarcado.
    checkboxElement.type = "checkbox";

    // 3. Adiciona uma classe do Bootstrap só pra estilização visual
    //(não afeta o comportamento, só a aparência)
    checkboxElement.classList.add("form-check-input");


    // 4. Define o estado INICIAL do checkbox com base no dado que veio da API
    //Se task.is_done for true, o checkbox já nasce marcado.
    //"checked" é uma propriedade booleana do elemento <input> tipo checkbox.
    checkboxElement.checked = task.is_done;

    // 5. Escuta o evento "change" -> dispara toda vez que o usuário
    //clica no checkbox e o estado muda (marca ou desmarca).
    //Repare: passamos a REFERÊNCIA da função (taskToggleHandler),
    //sem os parênteses — quem chama a função é o navegador, no
    //momento em que o evento acontece.
    checkboxElement.addEventListener("change", taskToggleHandler);

    // 6. Insere o checkbox no início do <li>, ANTES do nome da tarefa
    //prepend() = insere no começo | append() = insere no final
    liElement.prepend(checkboxElement);

    */

    // TODO (TF): Adicionar botão Excluir
    /*
   
    */

    return liElement;
}
