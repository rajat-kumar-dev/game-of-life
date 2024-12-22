interface Props {
    close: () => void;
}

function Info({ close }: Props) {
    return (
        <div className="gameInfo overlay" onClick={close}>
            <div className="info-container" onClick={(e) => e.stopPropagation()}>
                <h1>info</h1>
                <p>- to populate or depopulate click on the cell.</p>
                <p>- hold ctrl whild hovering over the cell to continuous cell population.</p>
            </div>
        </div>
    );
}

export default Info;
