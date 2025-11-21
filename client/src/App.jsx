import "./App.css";
import TwiboFrameEditor from "./components/TwiboFrameEditor.jsx";

function App() {
  return (
    <div className="app-shell">
      <div className="hero">
        <p className="eyebrow">PUP-CSC • Iska-Fest 2025</p>
        <h1>
          PUP-CSC LQ Frame Maker
          <span> for Iska-Fest</span>
        </h1>
        <p className="lead">
          Drop your barkada photo, drag it into place, and overlay the official
          Iska-Fest frame with pixel-perfect control.
        </p>
      </div>

      <TwiboFrameEditor />

      <footer>
        <p>Made with love by PCA Committee!!!!.</p>
        <p>Ayaw Gumana ng Twibbon, Bilang IT Ako na Magaadjust -Jon Carlo</p>
      </footer>
    </div>
  );
}

export default App;
