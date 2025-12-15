export default function Privacy() {
    return (
        <div className="legal-container">
            <h1 className="legal-header">Privacy Policy</h1>
            <p className="legal-date">Last Updated: December 2025</p>

            <div className="legal-content">
                <h3>1. Data Collection</h3>
                <p>We collect the following data to provide our services:</p>
                <ul>
                    <li>Discord User ID and Username</li>
                    <li>Message content (only command invocations)</li>
                    <li>In-game economy data (balance, inventory, pets)</li>
                </ul>

                <h3>2. Data Usage</h3>
                <p>Your data is used solely for the functionality of GoldBot. We do not sell or share your data with third parties.</p>

                <h3>3. Data Retention</h3>
                <p>We retain your data for as long as you use the service. You may request data deletion by contacting the owner or using `~settings delete_data` (if available) or via support server.</p>

                <h3>4. Cookies</h3>
                <p>This website uses essential cookies for authentication (NextAuth). No tracking cookies are used.</p>
            </div>
        </div>
    );
}
