// src/components/admin/AdminOverview.js
function AdminOverview({ stats }) {
    return (
      <div className="admin-overview">
        <h2>Statistika të Përgjithshme</h2>
        <div className="overview-content">
          <p>Mirë se vini në panelin e administratorit. 
            Këtu mund të menaxhoni përdoruesit e platformës, si dhe recetat e gatimit.</p>
          <div className="stats-summary">
            <h3>Statistika:</h3>
            <ul>
              <li>Numri i Përdoruesëve: {stats.totalUsers}</li>
              <li>Numri i Recetave: {stats.totalRecipes}</li>
              <li>Numri i Recetave të Paaprovuara: {stats.pendingRecipes}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  export default AdminOverview;