import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <h1 className="header__title">
        What Should I Watch
        <span className="header__accent"> in 10 Minutes?</span>
      </h1>
      <p className="header__subtitle">
        Short films, mini docs, TED talks &amp; more — curated for your mood and your time.
      </p>
    </header>
  );
}
