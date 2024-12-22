import { useEffect, useState } from "react";
import "./App.css";
import { produce } from "immer";
import { FaPlay, FaPause, FaAngleRight, FaAngleLeft, FaInfo } from "react-icons/fa6";
import Info from "./components/Info";

const ROWS = 20;
const COLS = 20;

function App() {
    const [grid, setGrid] = useState(getGrid(ROWS, COLS));
    const [running, setRunning] = useState(false);
    const [time, setTime] = useState(0);
    const [population, setPopulation] = useState(0);
    const [windowFocus, setWindowFocus] = useState(true);
    const [updateInterval, setUpdateInterval] = useState(200); //200ms
    const [showInfo, setShowInfo] = useState(false);
    function updateCellState(i: number, k: number, status: boolean) {
        if (grid[i][k] === status) return;
        setGrid((prevGrid) => {
            return produce(prevGrid, (draftGrid) => {
                draftGrid[i][k] = status;
            });
        });
    }

    function handlePlayClick() {
        setRunning(!running);
    }
    function gotoGeneration(dir: 1 | -1) {
        setRunning(false);
        if (dir === 1) {
            runSimulation(); //next generation
        }
        // previous generation
    }

    function toggleCellState(i: number, k: number) {
        updateCellState(i, k, !grid[i][k]);
    }

    function toggleShowInfo() {
        setShowInfo((prev) => !prev);
    }

    function runSimulation() {
        setGrid((prevGrid) => {
            return produce(prevGrid, (draftGrid) => {
                for (let i = 0; i < ROWS; i++) {
                    for (let k = 0; k < COLS; k++) {
                        const neighbors = getNeighborsCount(i, k, prevGrid);
                        if (neighbors < 2 || neighbors > 3) {
                            // cell dies due to underpopulation or overpopulation
                            draftGrid[i][k] = false;
                        } else if (!prevGrid[i][k] && neighbors === 3) {
                            // cell is born due to reproduction
                            draftGrid[i][k] = true;
                        }
                    }
                }
            });
        });
        setTime((prevTime) => prevTime + 1);
    }

    function resetGrid() {
        setTime(0);
        setRunning(false);
        setGrid(getGrid(ROWS, COLS));
    }
    function getRandomGrid() {
        setTime(0);
        setRunning(false);
        setGrid(getGrid(ROWS, COLS, true));
    }
    function handleMouseMoveOnGrid(e: React.MouseEvent<HTMLDivElement>) {
        if (e.ctrlKey) {
            const cell = e.target as HTMLDivElement;
            const { row, col } = cell.dataset as { row: string; col: string };
            if (!row || !col) return;
            updateCellState(+row, +col, true);
        }
    }

    useEffect(() => {
        let intervalID: number | null = null;
        if (running && windowFocus) {
            intervalID = setInterval(runSimulation, updateInterval);
        }

        return () => {
            if (intervalID) clearInterval(intervalID);
        };
    }, [running, windowFocus, updateInterval]);

    useEffect(() => {
        const pop = grid.flat().filter((cell) => cell).length;
        setPopulation(pop);
    }, [grid]);

    /**
     * handle window focus and blur events
     */
    const windowFocusHandler = () => setWindowFocus(true);
    const windowBlurHandler = () => setWindowFocus(false);
    useEffect(() => {
        window.addEventListener("focus", windowFocusHandler);
        window.addEventListener("blur", windowBlurHandler);

        return () => {
            window.removeEventListener("focus", windowFocusHandler);
            window.removeEventListener("blur", windowBlurHandler);
        };
    }, []);

    return (
        <>
            <div className="worldInfo">
                <div className="data">
                    <h1>game of life</h1>
                    <div>population:{population}</div>
                    <div>time:{time}</div>
                    <div>
                        <label htmlFor="interval">interval(ms):</label>
                        <input
                            type="number"
                            name="interval"
                            id="interval"
                            min={50}
                            max={10000}
                            placeholder="input time speed"
                            value={updateInterval}
                            onChange={({ target }) => setUpdateInterval(target.valueAsNumber)}
                        />
                    </div>
                </div>
                <div className="controls">
                    <button type="button" className="iconBtn" title="button" onClick={handlePlayClick}>
                        {running ? <FaPause /> : <FaPlay />}
                    </button>
                    <button type="button" className="iconBtn" title="button" onClick={() => gotoGeneration(-1)}>
                        <FaAngleLeft />
                    </button>
                    <button type="button" className="iconBtn" title="button" onClick={() => gotoGeneration(1)}>
                        <FaAngleRight />
                    </button>
                    <button type="button" className="" title="button" onClick={resetGrid}>
                        Reset
                    </button>
                    <button type="button" className="" title="button" onClick={getRandomGrid}>
                        Random
                    </button>
                    <button type="button" className="infoBtn" title="infoButton" onClick={toggleShowInfo}>
                        <FaInfo />
                    </button>
                </div>
            </div>
            <div
                className="grid-container"
                style={{
                    gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                    gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                }}
                onMouseOver={handleMouseMoveOnGrid}
            >
                {grid.map((row, i) =>
                    row.map((col, k) => (
                        <div
                            key={`${i}-${k}`}
                            className="grid-cell"
                            data-row={i}
                            data-col={k}
                            style={{ backgroundColor: col ? "green" : "black" }}
                            onClick={() => toggleCellState(i, k)}
                        ></div>
                    ))
                )}
            </div>
            {showInfo && <Info close={() => setShowInfo(false)} />}
        </>
    );
}

function getGrid(rows: number, cols: number, populateCell: boolean = false): boolean[][] {
    let mapFunction = () => false;
    if (populateCell) mapFunction = getRandomCellState;

    return Array.from({ length: rows }, () => Array.from({ length: cols }, mapFunction));
}

function getRandomCellState(): boolean {
    return Math.random() > 0.8 ? true : false;
}

const neighbors = [
    [-1, -1], //left top
    [-1, 0], // left
    [-1, 1], // left bottom
    [0, -1], // top
    [0, 1], // bottom
    [1, -1], // right top
    [1, 0], // right
    [1, 1], // right bottom
];

function getNeighborsCount(i: number, k: number, grid: boolean[][]) {
    let count = 0;
    neighbors.forEach(([x, y]) => {
        const newI = i + x;
        const newK = k + y;
        if (isInBounds(newI, newK) && grid[newI][newK]) count++;
    });
    return count;
}

function isInBounds(newI: number, newK: number) {
    return newI >= 0 && newI < ROWS && newK >= 0 && newK < COLS;
}
export default App;

// prev population button either put all states in stack or make a rule to reverse the state
