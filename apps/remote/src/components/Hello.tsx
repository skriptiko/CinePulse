import React from "react";

const Hello = () => {
	return (
		<div className="p-4 border-2 border-dashed border-blue-500 rounded-lg">
			<h2 className="text-xl font-bold text-blue-600">
				Hello from Remote MFE!
			</h2>
			<p className="text-gray-600">
				This component is served from the remote application.
			</p>
		</div>
	);
};

export default Hello;
