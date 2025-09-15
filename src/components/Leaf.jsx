// React import not required with the new JSX transform
import leafImage from '../assets/leaf.png';
import '../App.css';

const Leaf = ({ 
  children, 
  rotation = 0, 
  isNew = false, 
  fallDelay = 0,
  fallSpeed = 1,
  windEffect = 0,
  className = '' 
}) => {
  const leafStyle = {
    '--rotation': `${rotation}deg`,
    '--fall-delay': `${fallDelay}s`,
    '--fall-speed': fallSpeed,
    '--wind-effect': windEffect,
    opacity: isNew ? 0 : 1,
  };

  return (
    <div 
      className={`leaf-wrapper ${isNew ? 'new-leaf' : ''}`}
      style={leafStyle}
    >
      <img 
        src={leafImage} 
        alt="Decorative leaf" 
        className="leaf-image"
        draggable="false"
      />
      <div className="leaf-content">
        {children}
      </div>
    </div>
  );
};

export default Leaf;
