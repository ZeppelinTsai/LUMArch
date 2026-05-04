function openUpgradeModal() {
  const modal = new bootstrap.Modal(document.getElementById("upgradeModal"));
  modal.show();
}

function startUpgrade() {
  Swal.fire({
    icon: "info",
    title: "金流申請中",
    text: "LUMArch Pro 即將開放線上付款。",
    confirmButtonText: "知道了",
  });
}
