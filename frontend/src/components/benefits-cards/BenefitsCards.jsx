import React from 'react'
import './benefitsCards.css'

const BenefitsCards = ({icon: Icon, title, description}) => {
  return (
    <div className='card'>
        <div className='icon'><Icon size={22}/></div>
        <h3>{title}</h3>
        <p>{description}</p>
    </div>
  )
}

export default BenefitsCards