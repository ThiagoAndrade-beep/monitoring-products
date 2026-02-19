import React from 'react'
import './button.css'

const Button = ({children, variant, icon: Icon}) => {
  return (
    <div className={`button-${variant}`}>
        {children}
        {Icon && <Icon />}
    </div>
  )
}

export default Button