// window.addEventListener('load',main);


let MSGame = (function(){

    // private constants
    const STATE_HIDDEN = "hidden";
    const STATE_SHOWN = "shown";
    const STATE_MARKED = "marked";

    function array2d( nrows, ncols, val) {
        const res = [];
        for( let row = 0 ; row < nrows ; row ++) {
            res[row] = [];
            for( let col = 0 ; col < ncols ; col ++)
                res[row][col] = val(row,col);
        }
        return res;
    }

    // returns random integer in range [min, max]
    function rndInt(min, max) {
        [min,max] = [Math.ceil(min), Math.floor(max)]
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    class _MSGame {
        constructor() {
            this.init(8,10,10); // easy
        }

        validCoord(row, col) {
            return row >= 0 && row < this.nrows && col >= 0 && col < this.ncols;
        }

        init(nrows, ncols, nmines) {
            this.nrows = nrows;
            this.ncols = ncols;
            this.nmines = nmines;
            this.nmarked = 0;
            this.nuncovered = 0;
            this.exploded = false;
            // create an array
            this.arr = array2d(
                nrows, ncols,
                () => ({mine: false, state: STATE_HIDDEN, count: 0}));
        }

        count(row,col) {
            const c = (r,c) =>
                (this.validCoord(r,c) && this.arr[r][c].mine ? 1 : 0);
            let res = 0;
            for( let dr = -1 ; dr <= 1 ; dr ++ )
                for( let dc = -1 ; dc <= 1 ; dc ++ )
                    res += c(row+dr,col+dc);
            return res;
        }
        sprinkleMines(row, col) {
            // prepare a list of allowed coordinates for mine placement
            let allowed = [];
            for(let r = 0 ; r < this.nrows ; r ++ ) {
                for( let c = 0 ; c < this.ncols ; c ++ ) {
                    if(Math.abs(row-r) > 2 || Math.abs(col-c) > 2)
                        allowed.push([r,c]);
                }
            }
            this.nmines = Math.min(this.nmines, allowed.length);
            for( let i = 0 ; i < this.nmines ; i ++ ) {
                let j = rndInt(i, allowed.length-1);
                [allowed[i], allowed[j]] = [allowed[j], allowed[i]];
                let [r,c] = allowed[i];
                this.arr[r][c].mine = true;
            }
            // erase any marks (in case user placed them) and update counts
            for(let r = 0 ; r < this.nrows ; r ++ ) {
                for( let c = 0 ; c < this.ncols ; c ++ ) {
                    if(this.arr[r][c].state == STATE_MARKED)
                        this.arr[r][c].state = STATE_HIDDEN;
                    this.arr[r][c].count = this.count(r,c);
                }
            }
            let mines = []; let counts = [];
            for(let row = 0 ; row < this.nrows ; row ++ ) {
                let s = "";
                for( let col = 0 ; col < this.ncols ; col ++ ) {
                    s += this.arr[row][col].mine ? "B" : ".";
                }
                s += "  |  ";
                for( let col = 0 ; col < this.ncols ; col ++ ) {
                    s += this.arr[row][col].count.toString();
                }
                mines[row] = s;
            }
            console.log("Mines and counts after sprinkling:");
            console.log(mines.join("\n"), "\n");
        }

        // uncovers a cell at a given coordinate
        // this is the 'left-click' functionality
        uncover(row, col) {
            console.log("uncover", row, col);
            // if coordinates invalid, refuse this request
            if( ! this.validCoord(row,col)) return false;
            // if this is the very first move, populate the mines, but make
            // sure the current cell does not get a mine
            if( this.nuncovered === 0)
                this.sprinkleMines(row, col);
            // if cell is not hidden, ignore this move
            if( this.arr[row][col].state !== STATE_HIDDEN) return false;
            // floodfill all 0-count cells
            const ff = (r,c) => {
                if( ! this.validCoord(r,c)) return;
                if( this.arr[r][c].state !== STATE_HIDDEN) return;
                this.arr[r][c].state = STATE_SHOWN;
                this.nuncovered ++;
                if( this.arr[r][c].count !== 0) return;
                ff(r-1,c-1);ff(r-1,c);ff(r-1,c+1);
                ff(r  ,c-1);         ;ff(r  ,c+1);
                ff(r+1,c-1);ff(r+1,c);ff(r+1,c+1);
            };
            ff(row,col);
            // have we hit a mine?
            if( this.arr[row][col].mine) {
                this.exploded = true;
            }
            return true;
        }

        // puts a flag on a cell
        // this is the 'right-click' or 'long-tap' functionality
        mark(row, col) {
            console.log("mark", row, col);
            // if coordinates invalid, refuse this request
            if( ! this.validCoord(row,col)) return false;
            // if cell already uncovered, refuse this
            console.log("marking previous state=", this.arr[row][col].state);
            if( this.arr[row][col].state === STATE_SHOWN) return false;
            // accept the move and flip the marked status
            this.nmarked += this.arr[row][col].state == STATE_MARKED ? -1 : 1;
            this.arr[row][col].state = this.arr[row][col].state == STATE_MARKED ?
                STATE_HIDDEN : STATE_MARKED;
            return true;
        }
        // returns array of strings representing the rendering of the board
        //      "H" = hidden cell - no bomb
        //      "F" = hidden cell with a mark / flag
        //      "M" = uncovered mine (game should be over now)
        // '0'..'9' = number of mines in adjacent cells
        getRendering() {
            const res = [];
            for( let row = 0 ; row < this.nrows ; row ++) {
                let s = "";
                for( let col = 0 ; col < this.ncols ; col ++ ) {
                    let a = this.arr[row][col];
                    if( this.exploded && a.mine) s += "M";
                    else if( a.state === STATE_HIDDEN) s += "H";
                    else if( a.state === STATE_MARKED) s += "F";
                    else if( a.mine) s += "M";
                    else s += a.count.toString();
                }
                res[row] = s;
            }
            return res;
        }
        //create a visible table
        //      "H" = hidden cell - no bomb
        //      "F" = hidden cell with a mark / flag
        //      "M" = uncovered mine (game should be over now)
        // '0'..'9' = number of mines in adjacent cells


        createTable(twoDArray){
            // let hiddenCell =
            let table = document.createElement('table');
            let rowIndex = 0;
            table.style.marginTop = "20px";
            table.style.marginLeft = "auto";
            table.style.marginRight = "auto";
            // let tableBody = document.createElement('tbody');
            twoDArray.forEach(/*one row of cells in the table*/function(rowData) {

                let colIndex = 0;
                let tableRow = document.createElement('tr');
                rowData.forEach(/*each cell of the row*/function(cellData) {
                    let cell = document.createElement('td');
                    cell.setAttribute("id",rowIndex+"x"+colIndex);
                    cell.style.padding= "20px 20px";
                    if(cellData ==="H"){
                        cell.style.background = "darkblue";

                    }else if(cellData === "F"){
                        cell.style.backgroundImage = "url(image/flag2.png)";
                        cell.style.backgroundSize="40px 40px"
                    }
                    else if(cellData === "M"){
                        cell.style.backgroundImage = "url(image/mine.png)";
                        cell.style.backgroundSize="40px 40px"
                    }
                    else{
                        if(cellData === "0"){
                            cell.style.background = "gray";
                        }
                        else{
                            cell.innerHTML = cellData;
                            cell.style.background = "gray";
                            cell.style.textAlign = "center";
                            cell.style.paddingTop = "10px";
                            cell.style.paddingBottom = "10px";
                            cell.style.paddingLeft = "15px";
                            cell.style.paddingRight = "15px";
                        }
                    }
                    tableRow.appendChild(cell);
                    colIndex++;
                });
                table.appendChild(tableRow);
                rowIndex++;
            });
            // table.appendChild(tableBody);
            document.body.appendChild(table);
            // function removeTable(){
            //     document.body.removeChild(table);
            // }
        }
        updateTable(oldArray, newArray){
            for(let i = 0; i < oldArray.length; i++){
                for(let j = 0; j < oldArray[i].length; j++){
                    if(oldArray[i][j] !== newArray[i][j]){
                        let cell = document.getElementById(i+"x"+j);
                        if(newArray[i][j] ==="H"){
                            cell.style.background = "darkblue";

                        }else if(newArray[i][j] === "F"){
                            cell.style.backgroundImage = "url(image/flag2.png)";
                            cell.style.backgroundSize="40px 40px"
                        }
                        else if(newArray[i][j] === "M"){
                            cell.style.backgroundImage = "url(image/mine.png)";
                            cell.style.backgroundSize="40px 40px"
                        }
                        else{
                            if(newArray[i][j] === "0"){
                                cell.style.background = "gray";
                            }
                            else{
                                cell.innerHTML = newArray[i][j];
                                cell.style.background = "gray";
                                cell.style.textAlign = "center";
                                cell.style.paddingTop = "10px";
                                cell.style.paddingBottom = "10px";
                                cell.style.paddingLeft = "15px";
                                cell.style.paddingRight = "15px";
                            }
                        }
                    }

                }
            }
        }
        removeTable(){
            document.querySelector("table").remove();
        }
        getStatus() {
            let done = this.exploded ||
                this.nuncovered === this.nrows * this.ncols - this.nmines;
            return {
                done: done,
                exploded: this.exploded,
                nrows: this.nrows,
                ncols: this.ncols,
                nmarked: this.nmarked,
                nuncovered: this.nuncovered,
                nmines: this.nmines
            }
        }
    }



    return _MSGame;

})();
function convertTwoDArray(oneDArray){
    let gameTwoDArray =[];
    for(let i = 0; i < oneDArray.length; i++){
        let temp = [...oneDArray[i]];
        gameTwoDArray.push(temp);
    }
    return gameTwoDArray;
}
let seconds = 0;
let minutes = 0;
let hours = 0;
let t;
let s, m, h;

function increment(){
    //basic timer logic
    seconds ++;
    if(seconds >=60){
        seconds = 0;
        minutes ++;
        if(minutes >=60){
            minutes = 0;
            hours++;
            if(hours >= 10){
                console.error("Time exceeds 10 hours!")
            }
        }
    }
    //toString the timer(showing the timer on screen)

    //second
    if(seconds <= 9)
        s = "0"+ seconds;
    else
        s = seconds;
    //minute
    if(minutes === 0)
        m = "00";
    else if(minutes <= 9 && minutes > 0)
        m = "0" + minutes;
    else
        m = minutes;
    //hour
    if(hours === 0)
        h = "00";
    else if(hours <= 9 && hours > 0)
        h = "0" + hours;
    else
        h = hours;
    document.querySelector(".status-bar").querySelector(".timer")
        .textContent = h+":"+m+":"+s;

    timer();
}

function timer(){
    //nested function
    //call the incremental second function every second
    t = setTimeout(increment,1000);
}
function stop(){
    clearTimeout(t);
}
function main(){
    let rows = document.currentScript.getAttribute('data-rows');
    let cols = document.currentScript.getAttribute('data-cols');
    let mines = document.currentScript.getAttribute('data-mines');

    console.log("rows cols mines are:" ,rows, cols, mines);
    let game =  new MSGame();
    let steps = 0;
    game.init(rows,cols,mines);
    console.log(game.getRendering()/*.join("\n")*/);
    let gameOneDArray = game.getRendering();
    let gameTwoDArray = convertTwoDArray(gameOneDArray);
    // gameTwoDArray[7]=["F","M","F","1","2","4","9","0","F","F"];
    // gameTwoDArray[6]=["M","M","M","M","M","M","M","M","M","M"];
    // gameTwoDArray[5]=["1","1","1","1","1","1","1","1","1","1"];



    console.log(gameTwoDArray);
    let table = game.createTable(gameTwoDArray);
    let newGameTwoDArray;
    console.log(game.getStatus());
    // let i = 0;
    // while(true){
    //     if(game.getStatus().done === true){
    //         break;
    //     }
    // timer();
    let firstClick = true;
    document.querySelectorAll("td").forEach(item=>{
        item.addEventListener('click',()=>{
            if(firstClick === true){
                timer();
            }
            firstClick = false;
            let r,c;
            [r, c] = item.getAttribute("id").split("x").map(s=>Number(s));
            game.uncover(r,c);
            newGameTwoDArray = convertTwoDArray(game.getRendering());
            game.updateTable(gameTwoDArray,newGameTwoDArray);
            [gameTwoDArray,newGameTwoDArray] = [newGameTwoDArray,[]];
            // table = game.createTable(newGameTwoDArray);
            console.log("after!!");
            console.log(game.getStatus());
            steps++;
            console.log(steps);
            document.querySelector(".status-bar").querySelector(".moveCount").textContent = steps+"";
            if(game.getStatus().done===true){
                    stop();
                    if(game.getStatus().exploded === true){
                        const popup = document.querySelector(".popup");
                        let status = popup.querySelector(".popup-content").querySelector(".status");
                        status.textContent = ": (  GAME OVER";
                        let message = popup.querySelector(".popup-content").querySelector(".message");
                        message.textContent = "It took you "+ steps + " steps and "+hours+" hours "+minutes+" minutes "+seconds+" seconds";
                        popup.style.display = "block";

                        // popup.style.display = "block";
                    }
                    else if(game.getStatus().exploded === false){
                        const popup = document.querySelector(".popup");
                        let status = popup.querySelector(".popup-content").querySelector(".status");
                        status.textContent = "Congradulations! You Did It!";
                        let message = popup.querySelector(".popup-content").querySelector(".message");
                        message.textContent = "It took you "+ steps + " steps and "+h+" hours "+m+" minutes "+s+" seconds";
                        popup.style.display = "block";
                    }
            }
        })
    });
    document.querySelectorAll("td").forEach(item=>{
        item.addEventListener('contextmenu',function(e){
            e.preventDefault();
            if(firstClick === true){
                timer();
            }
            firstClick = false;
            let r,c;
            [r, c] = item.getAttribute("id").split("x").map(s=>Number(s));
            game.mark(r,c);
            newGameTwoDArray = convertTwoDArray(game.getRendering());
            game.updateTable(gameTwoDArray,newGameTwoDArray);
            [gameTwoDArray,newGameTwoDArray] = [newGameTwoDArray,[]];
            // table = game.createTable(newGameTwoDArray);
            console.log("after!!");
            console.log(game.getStatus());
            steps++;
            console.log(steps);
            document.querySelector(".status-bar").querySelector(".moveCount").textContent = steps+"";
            mines--;
            document.querySelector(".status-bar").querySelector(".mines").textContent = mines+"";
            if(game.getStatus().done===true){
                stop();
                if(game.getStatus().exploded === true){
                    const popup = document.querySelector(".popup");
                    let status = popup.querySelector(".popup-content").querySelector(".status");
                    status.textContent = "GAME OVER";
                    let message = popup.querySelector(".popup-content").querySelector(".message");
                    message.textContent = "It took you"+ steps +"steps";
                    popup.style.display = "block";
                }
                else if(game.getStatus().exploded === false){
                    const popup = document.querySelector(".popup");
                    let status = popup.querySelector(".popup-content").querySelector(".status");
                    status.textContent = "Congradulations! You did it!";
                    let message = popup.querySelector(".popup-content").querySelector(".message");
                    message.textContent = "It took you "+ steps +" steps";
                    popup.style.display = "block";
                }
            }
        })
    });


}
main();