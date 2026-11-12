import logo from '../../assets/ftms-logo.png';

// The FTMS logo. Leave `alt` empty when the name "FTMS" is written right next to it.
export default function AppLogo({ size = 40, alt = '', className = '' }) {
  return (
    <img
      src={logo}
      alt={alt}
      width={size}
      height={size}
      className={`app-logo ${className}`.trim()}
      draggable="false"
    />
  );
}
