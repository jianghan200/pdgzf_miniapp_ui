const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${[year, month, day].map(formatNumber).join('/')}`
}

const yesterday = function() {
  const now = new Date().getTime()
  return new Date(now - 24 * 60 * 60 * 1000)
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const groupBy = function( array , f ) {
  let groups = {};
  array.forEach( function( o ) {
      let group = JSON.stringify( f(o) );
      groups[group] = groups[group] || [];
      groups[group].push( o );
  });
  return Object.keys(groups).map( function( group ) {
      return groups[group];
  });
}

const validateEmail = function(email) {
  const emailRegex = /^(?:\w+\.?)*\w+@(?:\w+\.?)*\w+$/
  return emailRegex.test(email)
}

module.exports = {
  formatTime,
  formatDate,
  groupBy,
  yesterday,
  validateEmail : validateEmail
}
