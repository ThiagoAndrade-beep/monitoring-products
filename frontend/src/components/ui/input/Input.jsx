import React from 'react'
import './input.css'

const Input = ({type, name, placeholder, value, setState}) => {
  return (
    <input className='input' 
    type={type} 
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={(e) => setState(e.target.value)}
    required
    />
  )
}

export default Input