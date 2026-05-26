import { useState, useEffect } from 'react'
import { BorderBeam } from 'antd'
import apps from '../config/apps.json'
import categories from '../config/categories.json'
import * as AntIcons from '@ant-design/icons'
import './Home.css'

function Home() {
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [isDark, setIsDark] = useState(false)

    // Listen for theme changes on <html> element
    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
        }
        // Check initial theme
        checkTheme()

        // Observe for theme changes
        const observer = new MutationObserver(checkTheme)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
        return () => observer.disconnect()
    }, [])

    const activeApps = apps.filter(app => app.isActive === true)

    const filteredApps = selectedCategory === 'all'
        ? activeApps
        : activeApps.filter(app => app.category === selectedCategory)

    return (
        <div className='home-wrapper'>
            {/* Hero Section */}
            <div className='hero-section text-center'>
                <div className='status-badge-wrapper d-inline-flex mb-4' style={{ position: 'relative', borderRadius: '24px' }}>
                    {isDark &&
                        <BorderBeam>
                            <div className='status-badge d-inline-flex align-items-center'>
                                <div className='status-dot'></div>
                                <span>All systems operational</span>
                            </div>
                        </BorderBeam>
                    }
                    {!isDark &&
                        <div className='status-badge d-inline-flex align-items-center'>
                            <div className='status-dot'></div>
                            <span>All systems operational</span>
                        </div>
                    }
                </div>
                <div className='hero-content-wrapper mx-auto' style={{ position: 'relative', borderRadius: '20px' }}>
                    {isDark &&
                        <BorderBeam>
                            <div className='hero-content-inner'>
                                <h1 className='hero-title mb-3'>
                                    Everything Enfrasys, <span className='text-highlight'>in one place</span>
                                </h1>
                                <p className='hero-subtitle'>
                                    Access all your company applications from a single hub. No more bookmark<br />
                                    chaos — just pick an app and go.
                                </p>
                            </div>
                        </BorderBeam>
                    }
                    {!isDark &&
                        <div className='hero-content-inner'>
                            <h1 className='hero-title mb-3'>
                                Everything Enfrasys, <span className='text-highlight'>in one place</span>
                            </h1>
                            <p className='hero-subtitle'>
                                Access all your company applications from a single hub. No more bookmark<br />
                                chaos — just pick an app and go.
                            </p>
                        </div>
                    }
                </div>
            </div>

            <div className='home-container px-5 mx-auto' style={{ maxWidth: '1400px' }}>
                {/* Filter Section */}
                <div className='d-flex justify-content-between align-items-center mb-4'>
                    <div>
                        <h6 className='my-0 filter-title'>Filter by category</h6>
                        <small className='filter-subtitle'>Narrow down to find what you need faster</small>
                    </div>
                    <div>
                        <select
                            className='category-dropdown'
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">All ({activeApps.length})</option>
                            {categories.map(cat => {
                                const count = activeApps.filter(app => app.category === cat.id).length
                                return (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.label} ({count})
                                    </option>
                                )
                            })}
                        </select>
                    </div>
                </div>

                {/* App Cards Grid */}
                <div className='app-grid'>
                    {filteredApps.map(app => {
                        const category = categories.find(cat => cat.id === app.category)
                        const IconComponent = AntIcons[app.icon]

                        return (
                            <a key={app.id} href={app.url} target='_blank' rel='noopener noreferrer' className='app-card'>
                                <span className='link-icon'>
                                    <span className='bi bi-box-arrow-up-right'></span>
                                </span>
                                <div className='app-card-body'>
                                    {IconComponent && (
                                        <div className='app-icon-wrapper'>
                                            <IconComponent className='app-icon' />
                                        </div>
                                    )}
                                    <h6 className='app-title'>{app.title}</h6>
                                    <p className='app-subtitle'>{app.subtitle}</p>
                                    {category && (
                                        <span
                                            className='category-badge'
                                            style={{
                                                backgroundColor: category.color + '15',
                                                color: category.color
                                            }}
                                        >
                                            {category.label}
                                        </span>
                                    )}
                                </div>
                            </a>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default Home