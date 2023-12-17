import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from "/assets/images/logo.svg"
import Logout from "/assets/icons/logout.svg"
import { Button } from '../ui/button'
import { useSignOutAccount } from '@/lib/react-query/queriesAndMutations'
import { useUserContext } from '@/context/AuthContext'
import Loader from './Loader'



const Topbar = () => {

  const{ mutate: signOut, isPending: isSigningout ,isSuccess } = useSignOutAccount()
  const navigate = useNavigate()
  const { user } = useUserContext()

  useEffect(() => {
    if(isSuccess) {
      navigate(0)
    }
  
  }, [isSuccess])

  return (
    <section className='topbar'>
        <div className='flex-between py-4 px-5'>
            <Link to='/' className='flex items-center gap-5'>
                <img 
                 src={Logo}
                 alt="logo"
                 width={130}
                 height={325}
                />
            </Link>
            <div className='flex gap-4'>
              <Button 
                variant="ghost" 
                className='shad-button_ghost'
                onClick={() => signOut()}
                disabled={isSigningout}
              >
                {
                  isSigningout ? (
                    <div className='flex-center'>
                      <Loader />
                    </div>
                  ) : (
                    <img src={Logout} alt="logout" />
                  )
                }
              </Button>
              <Link to={`/profile/${user.id}`} className='flex-center gap-3'>
                <img 
                  src={ user.imageUrl || '/assets/icons/profile-placeholder.svg'}
                  alt="Profile"
                  className='h-8 w-8 rounded-full'
                />
              </Link>
            </div>
        </div>
    </section>
  )
}

export default Topbar