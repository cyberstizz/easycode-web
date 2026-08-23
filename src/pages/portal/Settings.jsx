import { useApi } from '../../lib/useApi'
import { useAuth } from '../../auth/AuthProvider'
import { EP } from '../../lib/endpoints'
import { TopBar } from '../../components/Shell'
import Avatar from '../../components/Avatar'
import Chip from '../../components/Chip'

/**
 * Read-only for now, and honest about it.
 *
 * `/v1/auth/me` is GET-only — there's no profile update endpoint and no
 * notification-preference storage yet. Rendering editable fields that silently
 * discard changes would be worse than showing the truth: you'd change your
 * phone number, assume it saved, and never get a call.
 */
export default function Settings() {
  const { user, org } = useAuth()
  const me = useApi(EP.me())
  const profile = me.data?.user || me.data || user

  return (
    <>
      <TopBar crumbs={[{ label: 'Settings' }]} />

      <div className="wrap" style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 className="h1">Settings</h1>
          <p className="sub">Your details and how you sign in.</p>
        </div>

        <div className="card pad" style={{ marginBottom: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>You</div>
          <div className="row" style={{ gap: 16, marginBottom: 20 }}>
            <Avatar name={profile?.name} size="lg" />
            <div>
              <div className="h3">{profile?.name || '—'}</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--mute)', marginTop: 3 }}>
                {profile?.email}
              </div>
            </div>
          </div>

          <div className="grid g2">
            <div>
              <div className="eyebrow">Business</div>
              <div style={{ fontSize: 13.5, color: 'var(--text)', marginTop: 5 }}>
                {org?.name || profile?.orgName || '—'}
              </div>
            </div>
            <div>
              <div className="eyebrow">Role</div>
              <div style={{ fontSize: 13.5, color: 'var(--text)', marginTop: 5 }}>
                {profile?.role === 'CLIENT' ? 'Client' : profile?.role || '—'}
              </div>
            </div>
          </div>

          <div className="note mute" style={{ marginTop: 16, fontSize: 12.5, lineHeight: 1.6 }}>
            Need any of this changed — your name, email, phone, or who else can get in?
            Send us a request and we&apos;ll take care of it.
          </div>
        </div>

        <div className="card pad">
          <div className="eyebrow" style={{ marginBottom: 15 }}>Signing in</div>
          <div className="stack tight">
            <div className="spread">
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--white)' }}>Password</div>
                <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 1 }}>
                  Use the reset link on the sign-in page to change it.
                </div>
              </div>
              <a href="/forgot-password" className="btn btn-s sm" style={{ textDecoration: 'none' }}>
                Reset password
              </a>
            </div>
            <div className="hr" style={{ margin: '9px 0' }} />
            <div className="spread">
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--white)' }}>Email notifications</div>
                <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 1 }}>
                  You get an email when we reply to a request, when your project moves
                  a stage, and when an invoice is due.
                </div>
              </div>
              <Chip tone="c-new">On</Chip>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}