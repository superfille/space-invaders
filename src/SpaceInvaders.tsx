import { useState, useEffect, useCallback } from 'react'
import './SpaceInvaders.css'

interface Bullet {
  id: number
  x: number
  y: number
}

interface EnemyBullet {
  id: number
  x: number
  y: number
  type: 'shooter' | 'putin' | 'trump' // Different bullet types for different enemies
  vx?: number // Horizontal velocity for homing drones
  targetX?: number // Target position for homing
}

interface Invader {
  id: number
  x: number
  y: number
  alive: boolean
  speed: number
  direction: number // -1 for left, 1 for right
  type: 'basic' | 'fast' | 'tank' | 'shooter' | 'boss' | 'putin' | 'trump'
  health: number
  maxHealth: number
  points: number
  lastShot?: number // For shooter enemies
}

const GAME_WIDTH = 800
const GAME_HEIGHT = 600
const PLAYER_WIDTH = 50
const PLAYER_HEIGHT = 30
const BULLET_WIDTH = 4
const BULLET_HEIGHT = 10
const INVADER_WIDTH = 30
const INVADER_HEIGHT = 20

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [playerPos, setPlayerPos] = useState({ x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - 60 })
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [invaders, setInvaders] = useState<Invader[]>([])
  const [keys, setKeys] = useState({ left: false, right: false, space: false })
  const [bulletId, setBulletId] = useState(0)
  const [dangerLevel, setDangerLevel] = useState(0) // 0 = safe, 1 = warning, 2 = critical
  const [enemyBullets, setEnemyBullets] = useState<EnemyBullet[]>([])
  const [enemyBulletId, setEnemyBulletId] = useState(0)
  const [playerHealth, setPlayerHealth] = useState(3) // Player has 3 lives
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now())

  // Initialize invaders
  const initializeInvaders = useCallback(() => {
    // Get enemy type properties
    const getEnemyType = (row: number, col: number) => {
      // Boss enemies (rare, in back)
      if (row === 0 && (col === 5 || col === 6)) {
        return { type: 'boss' as const, health: 5, points: 50, speedMultiplier: 0.3 }
      }
      // Putin enemy (special, rare)
      else if (row === 0 && col === 3) {
        return { type: 'putin' as const, health: 4, points: 100, speedMultiplier: 0.6 }
      }
      // Trump enemy (special, rare)
      else if (row === 0 && col === 8) {
        return { type: 'trump' as const, health: 3, points: 75, speedMultiplier: 0.8 }
      }
      // Shooter enemies (second row)
      else if (row === 1) {
        return { type: 'shooter' as const, health: 2, points: 25, speedMultiplier: 0.5 }
      }
      // Tank enemies (third row)
      else if (row === 2) {
        return { type: 'tank' as const, health: 3, points: 20, speedMultiplier: 0.4 }
      }
      // Fast enemies (fourth and fifth rows)
      else if (row >= 3 && row <= 4) {
        return { type: 'fast' as const, health: 1, points: 15, speedMultiplier: 1.5 }
      }
      // Basic enemies (front row)
      else {
        return { type: 'basic' as const, health: 1, points: 10, speedMultiplier: 1.0 }
      }
    }

    const newInvaders: Invader[] = []
    let id = 0
    for (let row = 0; row < 6; row++) { // 6 rows
      for (let col = 0; col < 12; col++) { // 12 columns
        const enemyType = getEnemyType(row, col)
        const baseSpeed = 0.2 + (row * 0.1) // Faster invaders in front rows
        
        newInvaders.push({
          id: id++,
          x: 50 + col * 55, // Tighter formation
          y: 30 + row * 45,
          alive: true,
          speed: (baseSpeed + Math.random() * 0.3) * enemyType.speedMultiplier,
          direction: Math.random() > 0.5 ? 1 : -1,
          type: enemyType.type,
          health: enemyType.health,
          maxHealth: enemyType.health,
          points: enemyType.points,
          lastShot: 0
        })
      }
    }
    setInvaders(newInvaders)
  }, [])

  // Get enemy appearance
  const getEnemyAppearance = (invader: Invader) => {
    const healthPercentage = invader.health / invader.maxHealth
    let appearance = ''
    
    switch (invader.type) {
      case 'boss': appearance = '👹'; break // Boss - big and scary
      case 'putin': appearance = '🇷🇺'; break // Putin - Russian flag emoji
      case 'trump': appearance = '🍊'; break // Trump - orange emoji
      case 'shooter': appearance = '🤖'; break // Shooter - robot-like
      case 'tank': appearance = '🛸'; break // Tank - UFO
      case 'fast': appearance = '👻'; break // Fast - ghost
      case 'basic': appearance = '👾'; break // Basic - classic invader
      default: appearance = '👾'
    }
    
    // Add damage indicator for damaged enemies
    if (healthPercentage < 1 && healthPercentage > 0.5) {
      appearance = '💥' + appearance
    } else if (healthPercentage <= 0.5) {
      appearance = '🔥' + appearance
    }
    
    return appearance
  }

  // Start game
  const startGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setDangerLevel(0)
    setPlayerPos({ x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - 60 })
    setBullets([])
    setBulletId(0)
    setEnemyBullets([])
    setEnemyBulletId(0)
    setPlayerHealth(3)
    setGameStartTime(Date.now()) // Set game start time for grace period
    initializeInvaders()
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          setKeys(prev => ({ ...prev, left: true }))
          break
        case 'ArrowRight':
        case 'd':
          setKeys(prev => ({ ...prev, right: true }))
          break
        case ' ':
          e.preventDefault()
          setKeys(prev => ({ ...prev, space: true }))
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          setKeys(prev => ({ ...prev, left: false }))
          break
        case 'ArrowRight':
        case 'd':
          setKeys(prev => ({ ...prev, right: false }))
          break
        case ' ':
          e.preventDefault()
          setKeys(prev => ({ ...prev, space: false }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const gameLoop = setInterval(() => {
      // Move player
      setPlayerPos(prev => {
        let newX = prev.x
        if (keys.left && prev.x > 0) {
          newX = prev.x - 5
        }
        if (keys.right && prev.x < GAME_WIDTH - PLAYER_WIDTH) {
          newX = prev.x + 5
        }
        return { ...prev, x: newX }
      })

      // Shoot bullets
      if (keys.space) {
        setBullets(prev => {
          const lastBullet = prev[prev.length - 1]
          if (!lastBullet || playerPos.y - lastBullet.y > 50) {
            setBulletId(prevId => prevId + 1)
            return [...prev, {
              id: bulletId + 1,
              x: playerPos.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
              y: playerPos.y
            }]
          }
          return prev
        })
      }

      // Move bullets
      setBullets(prev => 
        prev.map(bullet => ({ ...bullet, y: bullet.y - 8 }))
           .filter(bullet => bullet.y > 0)
      )

      // Enemy shooting logic
      const currentTime = Date.now()
      const timeSinceGameStart = currentTime - gameStartTime
      const GRACE_PERIOD = 5000 // 5 seconds of grace period where enemies don't shoot
      
      setInvaders(prevInvaders => {
        return prevInvaders.map(invader => {
          if (!invader.alive || timeSinceGameStart < GRACE_PERIOD) return invader
          
          const shouldShoot = () => {
            const timeSinceLastShot = currentTime - (invader.lastShot || 0)
            
            switch (invader.type) {
              case 'shooter':
                return timeSinceLastShot > 2000 + Math.random() * 2000 // 2-4 seconds
              case 'putin':
                return timeSinceLastShot > 1500 + Math.random() * 1500 // 1.5-3 seconds
              case 'trump':
                return timeSinceLastShot > 3000 + Math.random() * 2000 // 3-5 seconds for burst timing
              default:
                return false
            }
          }
          
          if (shouldShoot()) {
            const bulletsToFire = invader.type === 'trump' ? 3 : 1 // Trump fires 3 missiles in burst
            
            // Create enemy bullets
            for (let i = 0; i < bulletsToFire; i++) {
              setTimeout(() => {
                setEnemyBulletId(prevId => {
                  const newBulletId = prevId + 1
                  setEnemyBullets(prevBullets => [
                    ...prevBullets,
                    {
                      id: newBulletId,
                      x: invader.x + INVADER_WIDTH / 2 - BULLET_WIDTH / 2 + (i * 8 - 8), // Spread missiles/drones
                      y: invader.y + INVADER_HEIGHT,
                      type: invader.type as 'shooter' | 'putin' | 'trump',
                      vx: invader.type === 'putin' ? 0 : undefined, // Putin drones start with 0 horizontal velocity
                      targetX: invader.type === 'putin' ? playerPos.x + PLAYER_WIDTH / 2 : undefined // Putin drones target player
                    }
                  ])
                  return newBulletId
                })
              }, i * 150) // 150ms delay between burst missiles
            }
            
            return { ...invader, lastShot: currentTime }
          }
          
          return invader
        })
      })

      // Move enemy bullets
      setEnemyBullets(prev => 
        prev.map(bullet => {
          let newX = bullet.x
          const newY = bullet.y + 6 // Move down
          
          // Putin drones have homing behavior
          if (bullet.type === 'putin' && bullet.targetX !== undefined) {
            const distanceToTarget = bullet.targetX - bullet.x
            const homingStrength = 0.5 // How much the drone adjusts toward target
            newX = bullet.x + Math.sign(distanceToTarget) * Math.min(Math.abs(distanceToTarget) * homingStrength, 3)
            // Update target to current player position for continuous tracking
            return { 
              ...bullet, 
              x: newX, 
              y: newY, 
              targetX: playerPos.x + PLAYER_WIDTH / 2 
            }
          }
          
          return { ...bullet, x: newX, y: newY }
        }).filter(bullet => bullet.y < GAME_HEIGHT) // Remove off-screen bullets
      )

      // Move invaders
      setInvaders(prev => {
        let closestY = 0
        const newInvaders = prev.map(invader => {
          if (!invader.alive) return invader
          
          let newX = invader.x + invader.direction * invader.speed
          let newY = invader.y + 0.2 // Slow downward movement
          let newDirection = invader.direction
          
          // Track closest invader to player
          if (newY > closestY) closestY = newY
          
          // Bounce off walls and move down a bit
          if (newX <= 0 || newX >= GAME_WIDTH - INVADER_WIDTH) {
            newDirection = -invader.direction
            newY = invader.y + 10 // Move down more when hitting wall
            newX = Math.max(0, Math.min(GAME_WIDTH - INVADER_WIDTH, newX))
          }
          
          // Check if invader reached the player (game over)
          if (newY >= GAME_HEIGHT - 80) {
            setGameOver(true)
          }
          
          return { ...invader, x: newX, y: newY, direction: newDirection }
        })
        
        // Set danger level based on how close invaders are
        if (closestY > GAME_HEIGHT - 150) {
          setDangerLevel(2) // Critical
        } else if (closestY > GAME_HEIGHT - 250) {
          setDangerLevel(1) // Warning
        } else {
          setDangerLevel(0) // Safe
        }
        
        return newInvaders
      })

      // Check collisions
      setBullets(prevBullets => {
        const remainingBullets = [...prevBullets]
        
        setInvaders(prevInvaders => {
          const newInvaders = prevInvaders.map(invader => {
            if (!invader.alive) return invader
            
            const hitBullet = remainingBullets.find(bullet => 
              bullet.x < invader.x + INVADER_WIDTH &&
              bullet.x + BULLET_WIDTH > invader.x &&
              bullet.y < invader.y + INVADER_HEIGHT &&
              bullet.y + BULLET_HEIGHT > invader.y
            )
            
            if (hitBullet) {
              const bulletIndex = remainingBullets.indexOf(hitBullet)
              remainingBullets.splice(bulletIndex, 1)
              
              // Damage the invader
              const newHealth = invader.health - 1
              if (newHealth <= 0) {
                // Invader destroyed
                setScore(prev => prev + invader.points)
                return { ...invader, alive: false, health: 0 }
              } else {
                // Invader damaged but still alive
                return { ...invader, health: newHealth }
              }
            }
            
            return invader
          })
          
          // Check if all invaders are dead
          if (newInvaders.every(invader => !invader.alive)) {
            setGameOver(true)
          }
          
          return newInvaders
        })
        
        return remainingBullets
      })

      // Check enemy bullet vs player collision
      setEnemyBullets(prevEnemyBullets => {
        const remainingEnemyBullets = [...prevEnemyBullets]
        
        const hitBullet = remainingEnemyBullets.find(bullet => 
          bullet.x < playerPos.x + PLAYER_WIDTH &&
          bullet.x + BULLET_WIDTH > playerPos.x &&
          bullet.y < playerPos.y + PLAYER_HEIGHT &&
          bullet.y + BULLET_HEIGHT > playerPos.y
        )
        
        if (hitBullet) {
          const bulletIndex = remainingEnemyBullets.indexOf(hitBullet)
          remainingEnemyBullets.splice(bulletIndex, 1)
          
          // Reduce player health
          setPlayerHealth(prevHealth => {
            const newHealth = prevHealth - 1
            if (newHealth <= 0) {
              setGameOver(true)
            }
            return newHealth
          })
        }
        
        return remainingEnemyBullets
      })

    }, 1000 / 60) // 60 FPS

    return () => clearInterval(gameLoop)
  }, [gameStarted, gameOver, keys, playerPos, bulletId, enemyBulletId, gameStartTime])

  const getGameOverMessage = () => {
    if (invaders.every(invader => !invader.alive)) {
      return "🎉 Grattis! Du besegrade alla rymdvarelser!"
    } else {
      return "😵 Rymdvarelserna tog över jorden!"
    }
  }

  return (
    <div className="game-container">
      <div className="game-info">
        <div className="score">Poäng: {score}</div>
        <div className="health">❤️ {playerHealth}</div>
        {dangerLevel > 0 && (
          <div className={`danger-alert danger-${dangerLevel}`}>
            {dangerLevel === 1 && "⚠️ VARNING: Rymdvarelserna närmar sig!"}
            {dangerLevel === 2 && "🚨 FARA: De är för nära! Skjut snabbare!"}
          </div>
        )}
      </div>

      {!gameStarted ? (
        <div className="start-screen">
          <h2>Välkommen till Space Invaders!</h2>
          <p>Använd piltangenterna eller A/D för att flytta</p>
          <p>Tryck mellanslag för att skjuta</p>
          <p>⚠️ Rymdvarelserna rör sig mot dig - förstör dem innan de når dig!</p>
          <p>🎯 Specialfiender: 🇷🇺 Putin (100p), 🍊 Trump (75p)</p>
          <button className="start-button" onClick={startGame}>
            Starta Spel
          </button>
        </div>
      ) : gameOver ? (
        <div className="game-over">
          <h2>Spelet Slut!</h2>
          <p>{getGameOverMessage()}</p>
          <p>Din slutliga poäng: {score}</p>
          <button className="start-button" onClick={startGame}>
            Spela Igen
          </button>
        </div>
      ) : (
        <div className="game-area" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
          {/* Player */}
          <div 
            className="player"
            style={{
              left: playerPos.x,
              top: playerPos.y,
              width: PLAYER_WIDTH,
              height: PLAYER_HEIGHT
            }}
          >
            🚀
          </div>

          {/* Bullets */}
          {bullets.map(bullet => (
            <div
              key={bullet.id}
              className="bullet"
              style={{
                left: bullet.x,
                top: bullet.y,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT
              }}
            />
          ))}

          {/* Enemy Bullets */}
          {enemyBullets.map(bullet => (
            <div
              key={`enemy-${bullet.id}`}
              className={`enemy-bullet enemy-bullet-${bullet.type}`}
              style={{
                left: bullet.x,
                top: bullet.y,
                width: bullet.type === 'trump' ? BULLET_WIDTH * 2 : BULLET_WIDTH,
                height: bullet.type === 'trump' ? BULLET_HEIGHT * 2 : BULLET_HEIGHT,
                fontSize: bullet.type === 'putin' ? '14px' : bullet.type === 'trump' ? '16px' : '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {bullet.type === 'trump' ? '🚀' : bullet.type === 'putin' ? '🛰️' : ''}
            </div>
          ))}

          {/* Invaders */}
          {invaders.map(invader => invader.alive && (
            <div
              key={invader.id}
              className={`invader ${invader.type}-invader ${invader.health < invader.maxHealth ? 'damaged' : ''}`}
              style={{
                left: invader.x,
                top: invader.y,
                width: INVADER_WIDTH,
                height: INVADER_HEIGHT,
                opacity: invader.health / invader.maxHealth * 0.8 + 0.2
              }}
            >
              {getEnemyAppearance(invader)}
              {invader.health < invader.maxHealth && (
                <div className="health-bar">
                  <div 
                    className="health-fill" 
                    style={{ width: `${(invader.health / invader.maxHealth) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App