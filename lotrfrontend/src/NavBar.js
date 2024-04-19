import {Link,useMatch, useResolvedPath} from "react-router-dom"

export default function NavBar()
{
    return<nav className="nav">
        <Link to="/LOTRwebEditor.github.io/" className="site-title">LOTR</Link>
        <ul>
            <CustomLink to="/LOTRwebEditor.github.io/changelog">Change Log</CustomLink>
            <CustomLink to="/LOTRwebEditor.github.io/gamestate">Game State</CustomLink>
            <CustomLink to="/LOTRwebEditor.github.io/about">About</CustomLink>    
        </ul>
    </nav>
}

function CustomLink({to, children, ...props})
{
    const resolvedPath = useResolvedPath(to)
    const isActive = useMatch({path:resolvedPath.pathname, end:true}) 

    return(
        <li className={isActive ? "active": ""}>
            <Link to={to} {...props}>
                {children}
            </Link>
        </li>
    )
}