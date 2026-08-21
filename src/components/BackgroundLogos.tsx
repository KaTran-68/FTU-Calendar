import ftuLogo from '../assets/ftu-logo.png'
import hcmutLogo from '../assets/hcmut-logo.png'

export function BackgroundLogos() {
  return (
    <div className="app-background" aria-hidden="true">
      <img src={ftuLogo} alt="" className="app-background__logo app-background__logo--ftu" />
      <img src={hcmutLogo} alt="" className="app-background__logo app-background__logo--hcmut" />
    </div>
  )
}
