import {Link,useMatch, useResolvedPath} from "react-router-dom"

export default function NavBar()
{
    return<nav className="nav">
        <Link to="/LOTRScribble/" className="site-title">LOTR</Link>
        <ul>
            <CustomLink to="/LOTRScribble/">Data Overview</CustomLink>
            <CustomLink to="/LOTRScribble/changelog">Change Log</CustomLink>
            <CustomLink to="/LLOTRScribble/gamestate">Game State</CustomLink>
            <CustomLink to="/LOTRScribble/about">About</CustomLink>    
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