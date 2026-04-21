import React from "react";

export default function ApprovalPanel({ policy, approval, onRequestApproval }) {
  const blocked = policy && !policy.inPolicy;

  return (
    <section className="glass card approval-panel">
      <div className="panel-top">
        <div>
          <h3>Corporate Policy Guard</h3>
          <p>{blocked ? "Out-of-policy booking detected" : "This itinerary is in policy"}</p>
        </div>
        <span className={`policy-badge ${blocked ? "warn" : "ok"}`}>{blocked ? "Manager Approval Required" : "In-Policy"}</span>
      </div>

      {blocked && (
        <>
          <ul className="approval-reasons">
            {(policy?.reasons || []).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {!approval?.token ? (
            <button className="btn secondary" onClick={onRequestApproval}>Request Manager Approval</button>
          ) : (
            <div className="approval-token-box">
              <strong>Approval Token</strong>
              <p>{approval.token}</p>
              <small>Approved by {approval.approvedBy}</small>
            </div>
          )}
        </>
      )}
    </section>
  );
}
