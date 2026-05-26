import { useState, useEffect } from 'react'
import apps from '../config/apps.json'
import '../index.css'
import * as AntIcons from '@ant-design/icons'

function Header() {
    const activeApps = apps.filter(app => app.isActive === true)

    // Theme state: read from localStorage or default to 'light'
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('enfrahub-theme') || 'light'
    })

    // Apply theme to <html> on mount and when toggled
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('enfrahub-theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light')
    }

    return (
        <header className='d-flex align-items-center justify-content-between p-3 px-5 border-bottom' style={{ position: 'sticky', top: 0, zIndex: 100, transition: 'var(--transition-theme)' }}>
            {/* Left: Logo & Title */}
            <div className='d-flex align-items-center'>
                <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--accent-icon-bg)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: '16px',
                    transition: 'var(--transition-theme)'
                }}>
                    <AntIcons.AppstoreOutlined style={{ color: 'var(--accent-icon)', fontSize: '22px' }} />
                </div>
                <div>
                    <h5 className='py-0 my-0' style={{ color: 'var(--text-heading)', fontWeight: '600', transition: 'color 0.3s ease' }}>EnfraHub</h5>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', transition: 'color 0.3s ease' }}>Your Enfrasys App Gateway</span>
                </div>
            </div>

            {/* Right: App count + Theme toggle */}
            <div className='d-flex align-items-center gap-3'>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500', transition: 'color 0.3s ease' }}>{activeApps.length} apps</span>
                <button
                    onClick={toggleTheme}
                    aria-label='Toggle theme'
                    title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: 'var(--bg-toggle)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '16px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-toggle-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-toggle)'}
                >
                    <i className={`bi ${theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`} style={{ transition: 'all 0.3s ease' }}></i>
                </button>
            </div>
        </header>
    )
}

export default Header
