import BLOCKS from "./blocks.js"

//사용할 DOM 선언
const playground = document.querySelector(".playground > ul");//테트리스의 전체 판이 되는 ul 태그 가져옴
const gameText=document.querySelector('.game-text');
const scoreDisplay=document.querySelector('.score');
const restartButton=document.querySelector('.game-text > button');

//setting
const GAME_ROWS=20;
const GAME_COLS=10;

//variables
let score=0;
let duration=500; //블럭이 떨어지는 시간
let downInterval; //일단 null값으로 선언
let tempMovingItem; //moving 실행 전에 잠깐 item을 담아두는 용도
const movingItem={
    type:"",
    direction:0,
    top:0,
    left:3,
};

init();

//function
function init(){
    //tempMovingItem으로 테스트를 하고, 잘못되었을 경우 원복을 해야함 -> 그래서 movingItem과 tempMovingItem으로 나누는 것
    tempMovingItem={ ...movingItem}; //spread 연산자를 사용해서 movingItem 자체를 넣는 게 아니라 값만 넣음.
    
    for(let i=0; i<GAME_ROWS; i++){//가로줄 10개를 완성 -> 테트리스 틀 완성
        prependNewLine()
    }
    generateNewBlock();
}

function prependNewLine(){//가로줄 하나를 완성하는 함수
    const li=document.createElement("li"); //각 가로줄
    const ul = document.createElement("ul"); //각 세로칸들을 감싸는 ul들
    for(let j=0; j<GAME_COLS; j++){
        const matrix = document.createElement("li"); //작은 세로칸들
        ul.prepend(matrix); //각 세로칸을 감싸는 ul에 각 세로칸 li을 넣어준다
    }
    li.prepend(ul);//그 ul을 가로줄 li에 넣어준다
    playground.prepend(li);
}

function renderBlocks(moveType=""){//테트리스를 그리는 함수 / moveType파라미터를 받지 않는 경우 디폴트 값으로 ""
    const {type, direction, top, left}=tempMovingItem; //비구조화 할당을 하여 tempMovingItem의 각 요소를 변수로 사용

    //블럭 색칠 초기화 - 새로 render될 때 moving 클래스였던 블럭들에게서 다시 moving 클래스를 제거함
    const movingBlocks=document.querySelectorAll(".moving");
    movingBlocks.forEach(moving=>{moving.classList.remove(type, "moving");})

    BLOCKS[type][direction].some(block => {//현재 블럭의 좌표를 가져옴 -> forEach로 각 좌표값마다 함수를 적용함->forEach는 반복문을 중간에 스탑할 수 없기 때문에 some을 사용함
        const x=block[0]+left;
        const y=block[1]+top;
        //target : 현재 블럭(총 4칸 중 한 개)의 x,y 좌표를 묶은 것

        const target=playground.childNodes[y] ? playground.childNodes[y].childNodes[0].childNodes[x] : null;//배열처럼 돌리기 위해 childNodes 사용
        // playground.childNodes -> 각 가로줄 li들. 따라서 y값으로 접근해야 함
        // playground.childNodes[y].childNodes -> 각 가로줄 안의 10개의 작은 칸들을 감싸는 ul
        // playground.childNodes[y].childNodes[0].childNodes[x] -> 각 가로줄 안의 10개의 작은 칸들. 따라서 x값으로 접근해야 함
        // y값이 범위를 벗어날 경우 에러 -> y값이 존재하지 않으면 null값을 넣음 
        // x값이 범위를 벗어날 경우 에러 -> checkEmpty로 체크한다

        const isAvailable = checkEmpty(target);
        if(isAvailable){
            target.classList.add(type, "moving");//지금 선택된 블럭들에게 type의 클래스(색이 들어있음)을 부여해서 색칠함
        } else{
            tempMovingItem={ ...movingItem};//movingItem으로 원상복귀 시킨 후 다시 render
            if(moveType==='retry'){//(moveType이 retry인 경우) = (두 번 연속 else로 빠지는 경우) = (마지막 경우). 마지막이므로 downinterval을 삭제하고 게임오버 텍스트를 보여줌
                clearInterval(downInterval);
                showGameoverText();
            }
            setTimeout(()=>{ //재귀 함수 호출 사용시 발생할 에러를 방지하기 위해 setTimeout() 사용
                //딜레이를 0초를 주더라도, setTimeout을 사용하면 이벤트가 다 실행 된 후 다시 스택에 집어넣기 때문에 이벤트 스택이 넘치는 것을 방지할 수 있다.
                renderBlocks('retry');
                if(moveType === "top"){//최하단에 도달한거였다면, 블럭 고정
                    seizeBlock();
                }
            },0);
            return true;//빈 값이 나오면 나머지 블럭에 대해 반복하지 않고 처음부터 다시 하기 위해 return
        }
    })
    //렌더가 성공하면 tempMovingItem을 movingItem에 옮김
    movingItem.left=left;
    movingItem.top=top;
    movingItem.direction=direction;    
}

function seizeBlock(){
    //moving클래스의 블럭들을 seized클래스로 변경
    const movingBlocks=document.querySelectorAll(".moving");
    movingBlocks.forEach(moving=>{
        moving.classList.remove("moving");
        moving.classList.add("seized");
    })
    checkMatch();
}

function checkMatch(){//테트리스 한 줄이 완성되었는지 체크
    const childNodes = playground.childNodes; 
    childNodes.forEach(child=>{//가로줄 li들 체크
        let matched=true;

        child.children[0].childNodes.forEach(li=>{//각 칸 li들 체크
            if(!li.classList.contains('seized')){//한 칸이라도 'seized'가 아니면 한 줄이 완성되지 않은 것
                matched=false;
            }
        });
        console.log(matched);
        if(matched){//한 줄 완성시 지우고 위에 빈 줄 생성
            child.remove();
            prependNewLine();
            score++; //점수 1점 올라감
            scoreDisplay.innerText = score; //score변수 내용을 innerText로 넣어줌
        }
    });
    generateNewBlock();
}

function generateNewBlock(){
    //자동으로 떨어짐
    clearInterval(downInterval);
    downInterval=setInterval(()=>{
        moveBlock('top',1);
    }, duration)

    //랜덤한 type의 블럭 생성
    //1. BLOCKS를 [key, value] 쌍의 배열로 변환
    //2. 배열 blockArray 길이 안의 랜덤 수 생성
    //3. 랜덤 수로 배열 blockArray에서 BLOCKS의 type이름을 가져옴
    const blockArray=Object.entries(BLOCKS);//Object.entries()는 객체의 [key, value] 쌍의 배열을 반환
    const randomIndex = Math.floor(Math.random() * blockArray.length);

    movingItem.type=blockArray[randomIndex][0];
    movingItem.top=0;
    movingItem.left=3;
    movingItem.direction=0;
    tempMovingItem={ ...movingItem};
    renderBlocks();
}

function checkEmpty(target){
    if(!target || target.classList.contains("seized")){//가려는 곳이, 갈 수 없는 곳이거나 이미 seized된 블럭이 있는 곳 일때
        return false;
    }
    return true;
}

function moveBlock(moveType, amount){//방향키 값에 따라 moveType을 받아서 이동한 뒤, 다시 render한다.
    tempMovingItem[moveType]+=amount;
    renderBlocks(moveType);
}

function changeDirection(){
    const direction = tempMovingItem.direction;
    direction===3?tempMovingItem.direction=0:tempMovingItem.direction+=1;
    renderBlocks();
}

function dropBlock(){//스페이스바를 누르면 블럭이 훅 떨어짐
    //현재 interval값을 지운 뒤, 훨씬 빠른 interval로 다시 설정
    clearInterval(downInterval);
    downInterval=setInterval(()=>{
        moveBlock('top', 1);
    },10);
}

function showGameoverText(){//게임종료시 game-text가 display:none에서 flex로 바뀜
    gameText.style.display="flex";
}

//event handling
document.addEventListener("keydown", e=>{//키를 눌렀을 때 생기는 이벤트. e=이벤트 객체
    switch(e.keyCode){//keycode : 각 key들이 갖는 고유한 코드
        case 39: //오른쪽 방향키
            moveBlock("left", 1);
            break;
        case 37: //왼쪽 방향키
            moveBlock("left", -1);
            break;
        case 40: //아래쪽 방향키
            moveBlock("top", 1);
            break;
        case 38: //위쪽 방향ㅇ키
            changeDirection();
            break;
        case 32: //스페이스바
            dropBlock();
            break;
        default:
            break;
    }
})

restartButton.addEventListener("click", ()=>{
    gameText.style.display="none";
    playground.innerHTML=""; //HTML 초기화
    init();
})