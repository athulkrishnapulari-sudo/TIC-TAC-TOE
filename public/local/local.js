const cells = document.querySelectorAll('.box');

let last= null

cells.forEach((element) => {
    element.addEventListener('click', () => {
        if(last==null){
            last="X";
            element.textContent=last;
        }
        else if(last=="X"){
            last="O"
            element.textContent="O"
        }
        else if(last=="O"){
            last="X";
            element.textContent="X"
        }

    });
});