import { FaLinkedin } from 'react-icons/fa6'
import { FiMail } from 'react-icons/fi'

export function Footer() {
  return (
    <footer className="app-footer">
      <p className="app-footer__year">
        © 2026 <img src="/favicon.png" alt="" className="app-footer__icon" />
        FTU2 Calendar
      </p>
      <p className="app-footer__note">Mọi đóng góp hãy liên hệ gmail ở dưới</p>
      <div className="app-footer__links">
        <a href="mailto:tkhoa06082005@gmail.com">
          <FiMail aria-hidden="true" />
          tkhoa06082005@gmail.com
        </a>
        <a href="https://www.linkedin.com/in/katran68" target="_blank" rel="noopener noreferrer">
          <FaLinkedin aria-hidden="true" />
          LinkedIn
        </a>
      </div>
    </footer>
  )
}
