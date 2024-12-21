import { useEffect, useState } from "react";
import "./App.css";
import { produce } from "immer";
import { FaPlay, FaPause } from "react-icons/fa6";

const ROWS = 50;
const COLS = 50;

function App() {
    const [grid, setGrid] = useState(getGrid(ROWS, COLS));
    const [running, setRunning] = useState(false);
    const [time, setTime] = useState(0);
    const [population, setPopulation] = useState(0);
    const [windowFocus, setWindowFocus] = useState(true);

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

    function toggleCellState(i: number, k: number) {
        updateCellState(i, k, !grid[i][k]);
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
            intervalID = setInterval(runSimulation, 500);
        }

        return () => {
            if (intervalID) clearInterval(intervalID);
        };
    }, [running, windowFocus]);

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
                time: {time}
                <br />
                population: {population}
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
            <div className="controls">
                <button type="button" className="playPauseBtn" title="button" onClick={handlePlayClick}>
                    {running ? <FaPause /> : <FaPlay />}
                </button>
                <button type="button" className="resetBtn" title="button" onClick={resetGrid}>
                    Reset
                </button>
                <button type="button" className="resetBtn" title="button" onClick={getRandomGrid}>
                    Random
                </button>
            </div>
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

// check logic for the rules
// next and prev cell state button either put all states in stack or make a rule to reverse the state
// grid on off
// time speed
// note for ctrl hover on grid
