import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">

          {/* Quick Links */}
          <div className="footer-section">
            <h3>Aksesoni shpejt</h3>
            <ul>
              <li><a href="/dashboard">Faqja kryesore</a></li>
              <li><a href="/recipes/new">Krijo Recetë</a></li>
              <li><a href="/my-recipes">Recetat e Mia</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3>Kontakt</h3>
            <ul>
              <li>Punoi: Emila Filipi, emila.filipi@fti.edu.al</li>
              <li>MSc. në Inteligjencë Artificiale dhe Optimizim</li>
              <li>Lënda: Bazë të Dhënash të Avancuara</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-copyright">
          <p>© {new Date().getFullYear()} Fakulteti i Teknologjisë së Informacionit. 
            Universiteti Politeknik i Tiranës. 
            Të gjitha të drejtat të rezervuara.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;