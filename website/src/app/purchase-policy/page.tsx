import Link from 'next/link';

export default function PurchasePolicy() {
    return (
        <div className="legal-container">
            <h1 className="legal-header">Purchase Policy</h1>
            <p className="legal-date">Last Updated: December 2025</p>

            <div className="legal-content">
                <p>
                    By completing a purchase on GoldBot and using GoldBot, you agree to the following
                    terms and conditions.
                </p>

                <h3>Terms of Service Compliance</h3>
                <p>
                    The user will comply with the GoldBot{' '}
                    <Link href="/terms">Terms of Service</Link>.
                </p>

                <h3>Recovery Agreement</h3>
                <p>
                    In the event of a blacklist or ban from GoldBot&apos;s services, the user agrees to
                    forfeit any and all claims to funds used to purchase any GoldBot related product or
                    service. The user also agrees to forfeit the services and/or items purchased entirely
                    and permanently in the event of a ban from GoldBot&apos;s services.
                </p>

                <h3>Chargeback Agreement and Refund Policy</h3>
                <p>
                    The user acknowledges that any and all purchased products and services are
                    non-refundable. In the event of filing for or initiating a chargeback on any GoldBot
                    purchase, the user will be permanently banned and blacklisted from any and all GoldBot
                    core and related services.
                </p>

                <h3>Support Policy</h3>
                <p>
                    If the user has purchased a custom product that is not exactly what was initially
                    requested when paid for, and is dissatisfied as a result, they must notify the
                    merchant. This must be done within <strong>48 hours</strong> of the disbursement of the
                    service or product. The user agrees to a <strong>7 day</strong> timeframe for
                    remediation of the issue.
                </p>
            </div>
        </div>
    );
}
